import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import admin, { adminAuth, adminDb } from "@/lib/firebase/admin"
import { deleteCloudinaryAssetsByUrls } from "@/lib/cloudinary-admin"
import { COLLECTIONS } from "@/lib/firebase/collections"
import type { AdminCourseSummary } from "@/lib/firebase/types"

const COURSE_STATUS_OPTIONS = [
  "Inscrições abertas",
  "Em andamento",
  "Finalizado",
  "Pausado",
  "Arquivado",
] as const

type CourseStatus = (typeof COURSE_STATUS_OPTIONS)[number]

type CreateCourseBody = {
  id?: string
  title?: string
  description?: string
  level?: "Beginner" | "Intermediate" | "Advanced"
  durationWeeks?: number
  coverUrl?: string | null
  status?: string
}

function resolveCourseStatus(status?: string): CourseStatus {
  const inputStatus = status?.trim()
  if (inputStatus && COURSE_STATUS_OPTIONS.includes(inputStatus as CourseStatus)) {
    return inputStatus as CourseStatus
  }
  return "Inscrições abertas"
}

async function deleteDocsInBatches(
  docs: FirebaseFirestore.QueryDocumentSnapshot[]
) {
  if (!docs.length) return
  let batch = adminDb.batch()
  let count = 0
  for (const doc of docs) {
    batch.delete(doc.ref)
    count += 1
    if (count >= 450) {
      await batch.commit()
      batch = adminDb.batch()
      count = 0
    }
  }
  if (count > 0) {
    await batch.commit()
  }
}

function extractAttachmentUrlsFromDocs(
  docs: FirebaseFirestore.QueryDocumentSnapshot[]
) {
  const urls: string[] = []
  docs.forEach((docSnap) => {
    const data = docSnap.data()
    const attachments = Array.isArray(data?.attachments) ? data.attachments : []
    attachments.forEach((attachment: { url?: unknown }) => {
      if (typeof attachment?.url === "string" && attachment.url.trim()) {
        urls.push(attachment.url.trim())
      }
    })
  })
  return urls
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

export async function GET(req: NextRequest) {
  const authCheck = await assertIsAdmin(req)
  if (!authCheck.ok) {
    return NextResponse.json(
      { error: authCheck.message },
      { status: authCheck.status }
    )
  }

  try {
    const coursesSnapshot = await adminDb.collection(COLLECTIONS.courses).get()

    const courses = await Promise.all(
      coursesSnapshot.docs.map(async (docSnap): Promise<AdminCourseSummary> => {
        const data = docSnap.data()

        const [tracksSnapshot, enrollmentsSnapshot, activitiesSnapshot] = await Promise.all([
          adminDb
            .collection(COLLECTIONS.tracks)
            .where("courseId", "==", docSnap.id)
            .get(),
          adminDb
            .collection(COLLECTIONS.enrollments)
            .where("courseId", "==", docSnap.id)
            .get(),
          adminDb
            .collection(COLLECTIONS.activities)
            .where("courseId", "==", docSnap.id)
            .get(),
        ])

        const trackUserIds = new Set<string>()
        tracksSnapshot.docs.forEach((trackSnap) => {
          const trackData = trackSnap.data()
          const ids = Array.isArray(trackData.userIds) ? trackData.userIds : []
          ids.forEach((id: string) => {
            if (typeof id === "string" && id.trim()) {
              trackUserIds.add(id)
            }
          })
        })

        const enrollmentUserIds = new Set<string>()
        enrollmentsSnapshot.docs.forEach((enrollmentSnap) => {
          const enrollmentData = enrollmentSnap.data()
          const id = enrollmentData.userId
          if (typeof id === "string" && id.trim()) {
            enrollmentUserIds.add(id)
          }
        })

        const studentsCount = new Set([
          ...trackUserIds.values(),
          ...enrollmentUserIds.values(),
        ]).size

        return {
          id: docSnap.id,
          title: (data.title as string) ?? "",
          description: (data.description as string) ?? "",
          level:
            ((data.level as "Beginner" | "Intermediate" | "Advanced") ??
              "Beginner"),
          durationWeeks: Number(data.durationWeeks ?? 0),
          coverUrl: (data.coverUrl as string | null) ?? null,
          status: (data.status as string) ?? "Inscrições abertas",
          modulesCount: tracksSnapshot.size,
          studentsCount,
          activitiesCount: activitiesSnapshot.size,
        }
      })
    )

    courses.sort((a, b) => a.title.localeCompare(b.title))
    return NextResponse.json(courses)
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

  let body: CreateCourseBody

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const title = body.title?.trim() ?? ""
  const description = body.description?.trim() ?? ""
  const level = body.level ?? "Beginner"
  const durationWeeks = Number(body.durationWeeks)
  const status = resolveCourseStatus(body.status)

  if (!title || !description || !Number.isFinite(durationWeeks) || durationWeeks <= 0) {
    return NextResponse.json(
      { error: "Title, description and positive durationWeeks are required" },
      { status: 400 }
    )
  }

  const now = admin.firestore.FieldValue.serverTimestamp()

  try {
    const ref = adminDb.collection(COLLECTIONS.courses).doc()

    await ref.set({
      title,
      description,
      level,
      durationWeeks,
      coverUrl: body.coverUrl?.trim() || null,
      status,
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
      coverUrl: body.coverUrl?.trim() || null,
      status,
      modulesCount: 0,
      studentsCount: 0,
      activitiesCount: 0,
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

  let body: CreateCourseBody

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

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
    updates.coverUrl = body.coverUrl?.trim() || null
  }

  if (body.status !== undefined) {
    updates.status = resolveCourseStatus(body.status)
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
    await deleteDocsInBatches(tracksSnapshot.docs)
    await deleteDocsInBatches(activitiesSnapshot.docs)
    await deleteDocsInBatches(materialsSnapshot.docs)
    await deleteDocsInBatches(enrollmentsSnapshot.docs)
    await courseRef.delete()

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("delete course failed", err)
    return NextResponse.json({ error: "Could not delete course" }, { status: 500 })
  }
}
