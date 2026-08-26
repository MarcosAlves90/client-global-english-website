import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import admin, { adminDb } from "@/lib/firebase/admin"
import { assertIsAdmin } from "@/lib/firebase/admin-request"
import { deleteCloudinaryAssetsByUrls } from "@/lib/cloudinary-admin"
import { COLLECTIONS } from "@/lib/firebase/collections"
import {
  deleteDocsInBatches,
  extractAttachmentUrlsFromDocs,
} from "@/lib/firebase/admin-firestore-utils"
import {
  normalizeCloudinaryUrlValue,
  isCloudinaryUrl,
} from "@/lib/cloudinary-url"
import {
  createCourseBodySchema,
  deleteCourseBodySchema,
  updateCourseBodySchema,
} from "@/lib/contracts/admin"
import type { AdminCourseSummary } from "@/lib/firebase/types"
import { buildAdminCourseCatalog } from "@/modules/courses/server/admin-course-summary"

const COURSE_STATUS_OPTIONS = [
  "Inscrições abertas",
  "Em andamento",
  "Finalizado",
  "Pausado",
  "Arquivado",
] as const

type CourseStatus = (typeof COURSE_STATUS_OPTIONS)[number]

function resolveCourseStatus(status?: string): CourseStatus {
  const inputStatus = status?.trim()
  if (inputStatus && COURSE_STATUS_OPTIONS.includes(inputStatus as CourseStatus)) {
    return inputStatus as CourseStatus
  }
  return "Inscrições abertas"
}

function normalizeUserIds(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return Array.from(
    new Set(
      value
        .filter((id): id is string => typeof id === "string")
        .map((id) => id.trim())
        .filter(Boolean)
    )
  )
}

export async function GET(req: NextRequest) {
  const authCheck = await assertIsAdmin(req)
  if (!authCheck.ok) {
    return NextResponse.json(
      { error: authCheck.message },
      { status: authCheck.status }
    )
  }

  try {
    const includeMetrics =
      new URL(req.url).searchParams.get("includeMetrics") === "true"
    const coursesSnapshot = await adminDb.collection(COLLECTIONS.courses).get()
    if (coursesSnapshot.empty) {
      if (!includeMetrics) {
        return NextResponse.json([])
      }
      return NextResponse.json({
        items: [],
        metrics: {
          coursesCount: 0,
          uniqueStudentsCount: 0,
          modulesCount: 0,
          activitiesCount: 0,
        },
      })
    }

    const [tracksSnapshot, enrollmentsSnapshot, activitiesSnapshot] = await Promise.all([
      adminDb.collection(COLLECTIONS.tracks).get(),
      adminDb.collection(COLLECTIONS.enrollments).get(),
      adminDb.collection(COLLECTIONS.activities).get(),
    ])

    const catalog = buildAdminCourseCatalog({
      courses: coursesSnapshot.docs,
      tracks: tracksSnapshot.docs,
      enrollments: enrollmentsSnapshot.docs,
      activities: activitiesSnapshot.docs,
    })

    return NextResponse.json(includeMetrics ? catalog : catalog.items)
  } catch (err) {
    console.error("list courses failed", err)
    return NextResponse.json({ error: "Could not list courses" }, { status: 500 })
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

  let rawBody: unknown

  try {
    rawBody = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsedBody = createCourseBodySchema.safeParse(rawBody)
  if (!parsedBody.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const body = parsedBody.data

  const title = body.title?.trim() ?? ""
  const description = body.description?.trim() ?? ""
  const level = body.level ?? "Beginner"
  const durationWeeks = Number(body.durationWeeks)
  const status = resolveCourseStatus(body.status)
  const teacherIds = normalizeUserIds(body.teacherIds)

  if (!title || !description || !Number.isFinite(durationWeeks) || durationWeeks <= 0) {
    return NextResponse.json(
      { error: "Title, description and positive durationWeeks are required" },
      { status: 400 }
    )
  }

  const now = admin.firestore.FieldValue.serverTimestamp()

  try {
    const ref = adminDb.collection(COLLECTIONS.courses).doc()

    const coverUrl = body.coverUrl && isCloudinaryUrl(body.coverUrl.trim())
      ? normalizeCloudinaryUrlValue(body.coverUrl) ?? null
      : body.coverUrl?.trim() || null

    await ref.set({
      title,
      description,
      level,
      durationWeeks,
      coverUrl,
      status,
      teacherIds,
      createdAt: now,
      updatedAt: now,
      createdBy: authCheck.uid,
    })

    const result: AdminCourseSummary = {
      id: ref.id,
      title,
      description,
      level,
      durationWeeks,
      coverUrl,
      status,
      modulesCount: 0,
      studentsCount: 0,
      activitiesCount: 0,
      teacherIds,
    }

    return NextResponse.json(result, { status: 201 })
  } catch (err) {
    console.error("create course failed", err)
    return NextResponse.json({ error: "Could not create course" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
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

  const parsedBody = updateCourseBodySchema.safeParse(rawBody)
  if (!parsedBody.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const body = parsedBody.data

  const id = body.id?.trim()
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 })
  }

  const updates: Record<string, unknown> = {
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }

  if (body.title !== undefined) {
    const title = body.title.trim()
    if (!title) {
      return NextResponse.json({ error: "title cannot be empty" }, { status: 400 })
    }
    updates.title = title
  }

  if (body.description !== undefined) {
    const description = body.description.trim()
    if (!description) {
      return NextResponse.json(
        { error: "description cannot be empty" },
        { status: 400 }
      )
    }
    updates.description = description
  }

  if (body.level !== undefined) {
    updates.level = body.level
  }

  if (body.durationWeeks !== undefined) {
    const durationWeeks = Number(body.durationWeeks)
    if (!Number.isFinite(durationWeeks) || durationWeeks <= 0) {
      return NextResponse.json(
        { error: "durationWeeks must be greater than zero" },
        { status: 400 }
      )
    }
    updates.durationWeeks = durationWeeks
  }

  if (body.coverUrl !== undefined) {
    const trimmedCoverUrl = body.coverUrl?.trim() || ""
    updates.coverUrl = isCloudinaryUrl(trimmedCoverUrl)
      ? normalizeCloudinaryUrlValue(trimmedCoverUrl) ?? null
      : trimmedCoverUrl || null
  }

  if (body.status !== undefined) {
    updates.status = resolveCourseStatus(body.status)
  }

  if (body.teacherIds !== undefined) {
    updates.teacherIds = normalizeUserIds(body.teacherIds)
  }

  try {
    await adminDb.collection(COLLECTIONS.courses).doc(id).set(updates, {
      merge: true,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("update course failed", err)
    return NextResponse.json({ error: "Could not update course" }, { status: 500 })
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

  const parsedBody = deleteCourseBodySchema.safeParse(rawBody)
  if (!parsedBody.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const id = parsedBody.data.id.trim()
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 })
  }

  try {
    const courseRef = adminDb.collection(COLLECTIONS.courses).doc(id)
    const courseSnap = await courseRef.get()
    if (!courseSnap.exists) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    const [
      tracksSnapshot,
      activitiesSnapshot,
      materialsSnapshot,
      enrollmentsSnapshot,
    ] = await Promise.all([
      adminDb.collection(COLLECTIONS.tracks).where("courseId", "==", id).get(),
      adminDb
        .collection(COLLECTIONS.activities)
        .where("courseId", "==", id)
        .get(),
      adminDb
        .collection(COLLECTIONS.materials)
        .where("courseId", "==", id)
        .get(),
      adminDb
        .collection(COLLECTIONS.enrollments)
        .where("courseId", "==", id)
        .get(),
    ])

    const courseData = courseSnap.data()
    const courseCoverUrl =
      typeof courseData?.coverUrl === "string" ? courseData.coverUrl.trim() : ""

    const attachmentUrls = [
      ...extractAttachmentUrlsFromDocs(materialsSnapshot.docs),
      ...extractAttachmentUrlsFromDocs(activitiesSnapshot.docs),
      ...(courseCoverUrl ? [courseCoverUrl] : []),
    ]

    await deleteCloudinaryAssetsByUrls(attachmentUrls)
    await deleteDocsInBatches(adminDb, tracksSnapshot.docs)
    await deleteDocsInBatches(adminDb, activitiesSnapshot.docs)
    await deleteDocsInBatches(adminDb, materialsSnapshot.docs)
    await deleteDocsInBatches(adminDb, enrollmentsSnapshot.docs)
    await courseRef.delete()

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("delete course failed", err)
    return NextResponse.json({ error: "Could not delete course" }, { status: 500 })
  }
}
