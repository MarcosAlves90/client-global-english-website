import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import admin, { adminAuth, adminDb } from "@/lib/firebase/admin"
import { deleteCloudinaryAssetsByUrls, isCloudinaryUrl } from "@/lib/cloudinary-admin"
import { COLLECTIONS } from "@/lib/firebase/collections"
import type { Activity } from "@/lib/firebase/types"

type CreateActivityBody = {
  courseId?: string
  trackId?: string
  title?: string
  type?: "lesson" | "quiz" | "assignment" | "project"
  order?: number
  estimatedMinutes?: number
  visibility?: "module" | "users" | "private"
  userIds?: string[]
  releaseAt?: string | null
  attachments?: { name?: string; url?: string; type?: string }[]
  questions?: {
    id?: string
    type?: "essay" | "single_choice" | "multiple_choice" | "true_false" | "short_answer"
    prompt?: string
    options?: string[]
    correctAnswers?: string[]
    points?: number
    required?: boolean
  }[]
}

async function assertIsAdmin(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  const token = authHeader?.split(" ")[1]
  if (!token) {
    return { ok: false, status: 401, message: "Missing auth token" }
  }

  try {
    const decoded = await adminAuth.verifyIdToken(token)
    const doc = await adminDb.collection(COLLECTIONS.users).doc(decoded.uid).get()
    const data = doc.data()

    if (data?.role === "admin") {
      return { ok: true, uid: decoded.uid }
    }

    return { ok: false, status: 403, message: "Admin access required" }
  } catch (err) {
    console.error("token verification failed", err)
    return { ok: false, status: 401, message: "Invalid auth token" }
  }
}

function normalizeUserIds(input?: unknown) {
  if (!Array.isArray(input)) {
    return []
  }

  const cleaned = input
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean)

  return Array.from(new Set(cleaned))
}

function resolveReleaseAt(input?: string | null) {
  if (!input) {
    return null
  }
  const parsed = new Date(input)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }
  return admin.firestore.Timestamp.fromDate(parsed)
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
    attachments: mapped.filter((item) => isCloudinaryUrl(item.url)),
    invalidUrls,
  }
}

function normalizeQuestions(input?: unknown) {
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
        item?.type === "short_answer"
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

      return {
        id,
        type,
        prompt,
        options,
        correctAnswers,
        points,
        required,
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

    const activities: Activity[] = snapshot.docs.map((docSnap) => {
      const data = docSnap.data()
      return {
        id: docSnap.id,
        courseId: data.courseId,
        trackId: data.trackId,
        title: data.title ?? "",
        type: data.type ?? "lesson",
        order: Number(data.order ?? 0),
        estimatedMinutes: Number(data.estimatedMinutes ?? 0),
        visibility: data.visibility ?? "private",
        userIds: Array.isArray(data.userIds) ? data.userIds : [],
        releaseAt: data.releaseAt?.toDate?.() ?? null,
        attachments: Array.isArray(data.attachments) ? data.attachments : [],
        questions: Array.isArray(data.questions) ? data.questions : [],
      }
    })

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
  const authCheck = await assertIsAdmin(req)
  if (!authCheck.ok) {
    return NextResponse.json(
      { error: authCheck.message },
      { status: authCheck.status }
    )
  }

  let body: CreateActivityBody

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const courseId = body.courseId?.trim()
  const trackId = body.trackId?.trim()
  const title = body.title?.trim() ?? ""
  const type = body.type
  const estimatedMinutes = Number(body.estimatedMinutes ?? 0)
  const visibility = body.visibility ?? "private"
  const { attachments, invalidUrls } = normalizeAttachments(body.attachments)
  const questions = normalizeQuestions(body.questions)

  if (!courseId || !trackId || !title || !type || estimatedMinutes <= 0) {
    return NextResponse.json(
      { error: "courseId, trackId, title, type and estimatedMinutes are required" },
      { status: 400 }
    )
  }

  if (invalidUrls.length > 0) {
    return NextResponse.json(
      { error: "attachments must use Cloudinary URLs" },
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

  let order = parseOrder(body.order)
  if (order === null) {
    order = await resolveNextOrder(trackId)
  }

  const releaseAt = visibility === "private" ? null : resolveReleaseAt(body.releaseAt)
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

export async function DELETE(req: NextRequest) {
  const authCheck = await assertIsAdmin(req)
  if (!authCheck.ok) {
    return NextResponse.json(
      { error: authCheck.message },
      { status: authCheck.status }
    )
  }

  let body: { id?: string }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const id = body.id?.trim()
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
    const urls = attachments
      .map((item: { url?: unknown }) =>
        typeof item?.url === "string" ? item.url : null
      )
      .filter((value: string | null): value is string => Boolean(value))

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
