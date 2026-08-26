import type { DocumentData } from "firebase-admin/firestore"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import admin, { adminDb } from "@/lib/firebase/admin"
import { parseActivityDate, validateActivitySchedule } from "@/lib/activities/deadlines"
import { assertHasRole, assertIsAdmin } from "@/lib/firebase/admin-request"
import { areUsersEnrolledInCourse } from "@/lib/auth/course-access"
import { canManageCourseAsTeacher } from "@/lib/firebase/teacher-access"
import {
  deleteCloudinaryAssetsByUrls,
  isCloudinaryUrl,
} from "@/lib/cloudinary-admin"
import {
  normalizeCloudinaryUrlItems,
} from "@/lib/cloudinary-url"
import { COLLECTIONS } from "@/lib/firebase/collections"
import {
  createActivityBodySchema,
  deleteActivityBodySchema,
  updateActivityBodySchema,
} from "@/lib/contracts/admin"
import type { Activity } from "@/lib/firebase/types"

function normalizeUserIds(input?: unknown) {
  if (!Array.isArray(input)) {
    return []
  }

  const cleaned = input
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean)

  return Array.from(new Set(cleaned))
}

function resolveDate(input?: string | null) {
  const parsed = parseActivityDate(input)
  return parsed ? admin.firestore.Timestamp.fromDate(parsed) : null
}

const ATTACHMENT_TYPES = new Set(["pdf", "video", "link", "audio"])

function normalizeAttachments(input?: unknown) {
  if (!Array.isArray(input)) {
    return {
      attachments: [],
      invalidUrls: [] as string[],
    }
  }

  const mapped = input
    .map((item) => ({
      name: typeof item?.name === "string" ? item.name.trim() : "",
      url: typeof item?.url === "string" ? item.url.trim() : "",
      type:
        typeof item?.type === "string" && ATTACHMENT_TYPES.has(item.type)
          ? item.type
          : "link",
    }))
    .filter((item) => item.url)

  const invalidUrls = mapped
    .filter((item) => !isCloudinaryUrl(item.url))
    .map((item) => item.url)

  return {
    attachments: normalizeCloudinaryUrlItems(
      mapped.filter((item) => isCloudinaryUrl(item.url))
    ),
    invalidUrls,
  }
}

function normalizeQuestions(input?: unknown): NonNullable<Activity["questions"]> {
  if (!Array.isArray(input)) {
    return []
  }
  return input
    .map((item, index) => {
      const type =
        item?.type === "essay" ||
        item?.type === "single_choice" ||
        item?.type === "multiple_choice" ||
        item?.type === "true_false" ||
        item?.type === "short_answer" ||
        item?.type === "audio_response"
          ? item.type
          : "essay"
      const prompt = typeof item?.prompt === "string" ? item.prompt.trim() : ""
      const options = Array.isArray(item?.options)
        ? item.options.map((opt: unknown) =>
            typeof opt === "string" ? opt.trim() : ""
          ).filter(Boolean)
        : []
      const correctAnswers = Array.isArray(item?.correctAnswers)
        ? item.correctAnswers.map((opt: unknown) =>
            typeof opt === "string" ? opt.trim() : ""
          ).filter(Boolean)
        : []
      const pointsRaw = Number(item?.points ?? 0)
      const points = Number.isFinite(pointsRaw) && pointsRaw > 0 ? pointsRaw : 0
      const required = Boolean(item?.required)
      const id =
        typeof item?.id === "string" && item.id.trim()
          ? item.id.trim()
          : `q-${index + 1}`
      const promptAudioItems = normalizeCloudinaryUrlItems(
        item?.promptAudio && typeof item.promptAudio === "object"
          ? [{
              name: typeof item.promptAudio.name === "string" ? item.promptAudio.name.trim() : "Áudio da questão",
              url: typeof item.promptAudio.url === "string" ? item.promptAudio.url.trim() : "",
              type: "audio" as const,
            }]
          : []
      )
      const promptAudio = promptAudioItems[0]

      return {
        id,
        type,
        prompt,
        options,
        correctAnswers,
        points,
        required,
        ...(promptAudio ? { promptAudio } : {}),
      }
    })
    .filter((item) => item.prompt)
}

function parseOrder(input?: number) {
  if (input === undefined || input === null) {
    return null
  }

  const value = Number(input)
  if (!Number.isFinite(value) || value <= 0) {
    return null
  }

  return Math.floor(value)
}

async function resolveNextOrder(trackId: string) {
  const snapshot = await adminDb
    .collection(COLLECTIONS.activities)
    .where("trackId", "==", trackId)
    .get()

  if (snapshot.empty) {
    return 1
  }

  let maxOrder = 0
  snapshot.docs.forEach((docSnap) => {
    const value = Number(docSnap.data()?.order ?? 0)
    if (Number.isFinite(value) && value > maxOrder) {
      maxOrder = value
    }
  })

  return maxOrder + 1
}

function mapActivityDoc(docSnap: {
  id: string
  data: () => DocumentData | undefined
}): Activity {
  const data = docSnap.data() ?? {}
  return {
    id: docSnap.id,
    courseId: typeof data.courseId === "string" ? data.courseId : "",
    trackId: typeof data.trackId === "string" ? data.trackId : "",
    title: typeof data.title === "string" ? data.title : "",
    type:
      data.type === "quiz" || data.type === "assignment" || data.type === "project"
        ? data.type
        : "lesson",
    order: Number(data.order ?? 0),
    estimatedMinutes: Number(data.estimatedMinutes ?? 0),
    visibility:
      data.visibility === "module" || data.visibility === "users" || data.visibility === "private"
        ? data.visibility
        : "private",
    userIds: Array.isArray(data.userIds) ? data.userIds : [],
    releaseAt: data.releaseAt?.toDate?.() ?? null,
    dueAt: data.dueAt?.toDate?.() ?? null,
    closeAt: data.closeAt?.toDate?.() ?? null,
    attachments: normalizeAttachments(data.attachments).attachments,
    questions: normalizeQuestions(data.questions),
  }
}

export async function GET(req: NextRequest) {
  const authCheck = await assertIsAdmin(req)
  if (!authCheck.ok) {
    return NextResponse.json(
      { error: authCheck.message },
      { status: authCheck.status }
    )
  }

  const { searchParams } = new URL(req.url)
  const courseId = searchParams.get("courseId")?.trim()

  if (!courseId) {
    return NextResponse.json({ error: "courseId is required" }, { status: 400 })
  }

  try {
    const snapshot = await adminDb
      .collection(COLLECTIONS.activities)
      .where("courseId", "==", courseId)
      .get()

    const activities: Activity[] = snapshot.docs.map(mapActivityDoc)

    activities.sort((a, b) => a.order - b.order)

    return NextResponse.json(activities)
  } catch (err) {
    console.error("list activities failed", err)
    return NextResponse.json(
      { error: "Could not list activities" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await assertHasRole(req, ["teacher", "admin"])
  if (!authCheck.ok) {
    return NextResponse.json(
      { error: authCheck.message },
      { status: authCheck.status }
    )
  }

  let rawBody: unknown

  try {
    rawBody = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsedBody = createActivityBodySchema.safeParse(rawBody)
  if (!parsedBody.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const body = parsedBody.data

  const courseId = body.courseId?.trim()
  const trackId = body.trackId?.trim()
  const title = body.title?.trim() ?? ""
  const type = body.type
  const estimatedMinutes = Number(body.estimatedMinutes ?? 0)
  const visibility = body.visibility ?? "private"
  const { attachments, invalidUrls } = normalizeAttachments(body.attachments)
  const invalidQuestionAudioUrls = (body.questions ?? [])
    .map((question) => question.promptAudio?.url?.trim() ?? "")
    .filter((url) => url && !isCloudinaryUrl(url))
  const questions = normalizeQuestions(body.questions)

  if (!courseId || !trackId || !title || !type || estimatedMinutes <= 0) {
    return NextResponse.json(
      { error: "courseId, trackId, title, type and estimatedMinutes are required" },
      { status: 400 }
    )
  }

  if (!(await canManageCourseAsTeacher({ ...authCheck, courseId }))) {
    return NextResponse.json({ error: "Course access denied" }, { status: 403 })
  }

  const trackSnapshot = await adminDb.collection(COLLECTIONS.tracks).doc(trackId).get()
  if (!trackSnapshot.exists || trackSnapshot.data()?.courseId !== courseId) {
    return NextResponse.json({ error: "Track does not belong to course" }, { status: 400 })
  }

  if (invalidUrls.length > 0) {
    return NextResponse.json(
      { error: "attachments must use Cloudinary URLs" },
      { status: 400 }
    )
  }

  if (invalidQuestionAudioUrls.length > 0) {
    return NextResponse.json(
      { error: "question audio must use Cloudinary URLs" },
      { status: 400 }
    )
  }

  const userIds = normalizeUserIds(body.userIds)
  if (visibility === "users" && userIds.length === 0) {
    return NextResponse.json(
      { error: "userIds are required for users visibility" },
      { status: 400 }
    )
  }

  if (authCheck.role === "teacher" && visibility === "users") {
    const enrollmentsSnapshot = await adminDb
      .collection(COLLECTIONS.enrollments)
      .where("courseId", "==", courseId)
      .get()
    const enrollmentUserIds = enrollmentsSnapshot.docs.map(
      (item) => item.data()?.userId
    )

    if (!areUsersEnrolledInCourse(userIds, enrollmentUserIds)) {
      return NextResponse.json(
        { error: "Selected users must be enrolled in the course" },
        { status: 403 }
      )
    }
  }

  let order = parseOrder(body.order)
  if (order === null) {
    order = await resolveNextOrder(trackId)
  }

  const releaseAtInput = visibility === "private" ? null : body.releaseAt
  const scheduleValidation = validateActivitySchedule({
    releaseAt: releaseAtInput,
    dueAt: body.dueAt,
    closeAt: body.closeAt,
  })
  if (!scheduleValidation.ok) {
    return NextResponse.json(
      { error: scheduleValidation.message },
      { status: 400 }
    )
  }

  const releaseAt = resolveDate(releaseAtInput)
  const dueAt = resolveDate(body.dueAt)
  const closeAt = resolveDate(body.closeAt)
  const now = admin.firestore.FieldValue.serverTimestamp()

  try {
    const ref = adminDb.collection(COLLECTIONS.activities).doc()

    await ref.set({
      courseId,
      trackId,
      title,
      type,
      order,
      estimatedMinutes,
      visibility,
      userIds: visibility === "users" ? userIds : [],
      releaseAt,
      dueAt,
      closeAt,
      attachments,
      questions,
      createdAt: now,
      updatedAt: now,
      createdBy: authCheck.uid,
    })

    const result: Activity = {
      id: ref.id,
      courseId,
      trackId,
      title,
      type,
      order,
      estimatedMinutes,
      visibility,
      userIds: visibility === "users" ? userIds : [],
      releaseAt: releaseAt ? releaseAt.toDate() : null,
      dueAt: dueAt ? dueAt.toDate() : null,
      closeAt: closeAt ? closeAt.toDate() : null,
      attachments,
      questions,
    }

    return NextResponse.json(result, { status: 201 })
  } catch (err) {
    console.error("create activity failed", err)
    return NextResponse.json(
      { error: "Could not create activity" },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest) {
  const authCheck = await assertIsAdmin(req)
  if (!authCheck.ok) {
    return NextResponse.json({ error: authCheck.message }, { status: authCheck.status })
  }

  let rawBody: unknown
  try {
    rawBody = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsedBody = updateActivityBodySchema.safeParse(rawBody)
  if (!parsedBody.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const id = parsedBody.data.id?.trim()
  if (!id || parsedBody.data.attachments === undefined) {
    return NextResponse.json({ error: "id and attachments are required" }, { status: 400 })
  }

  const { attachments, invalidUrls } = normalizeAttachments(parsedBody.data.attachments)
  if (invalidUrls.length > 0) {
    return NextResponse.json({ error: "attachments must use Cloudinary URLs" }, { status: 400 })
  }

  try {
    const ref = adminDb.collection(COLLECTIONS.activities).doc(id)
    const snap = await ref.get()
    if (!snap.exists) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404 })
    }

    await ref.update({
      attachments,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: authCheck.uid,
    })
    return NextResponse.json(mapActivityDoc(await ref.get()))
  } catch (err) {
    console.error("update activity failed", err)
    return NextResponse.json({ error: "Could not update activity" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const authCheck = await assertIsAdmin(req)
  if (!authCheck.ok) {
    return NextResponse.json(
      { error: authCheck.message },
      { status: authCheck.status }
    )
  }

  let rawBody: unknown

  try {
    rawBody = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsedBody = deleteActivityBodySchema.safeParse(rawBody)
  if (!parsedBody.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const id = parsedBody.data.id.trim()
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 })
  }

  try {
    const ref = adminDb.collection(COLLECTIONS.activities).doc(id)
    const snap = await ref.get()
    if (!snap.exists) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404 })
    }

    const data = snap.data()
    const attachments = Array.isArray(data?.attachments) ? data.attachments : []
    const questions = Array.isArray(data?.questions) ? data.questions : []
    const urls = [
      ...attachments.map((item: { url?: unknown }) =>
        typeof item?.url === "string" ? item.url : null
      ),
      ...questions.map((item: { promptAudio?: { url?: unknown } }) =>
        typeof item?.promptAudio?.url === "string" ? item.promptAudio.url : null
      ),
    ].filter((value: string | null): value is string => Boolean(value))

    await deleteCloudinaryAssetsByUrls(urls)
    await ref.delete()
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("delete activity failed", err)
    return NextResponse.json(
      { error: "Could not delete activity" },
      { status: 500 }
    )
  }
}
