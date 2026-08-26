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
  createTrackBodySchema,
  deleteTrackBodySchema,
  updateTrackBodySchema,
} from "@/lib/contracts/admin"
import type { Track } from "@/lib/firebase/types"
import { buildCourseEnrollmentSyncPlan } from "@/modules/courses/server/course-enrollment-sync"

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

function normalizeUserIds(input?: unknown) {
  if (!Array.isArray(input)) {
    return []
  }

  const cleaned = input
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean)

  return Array.from(new Set(cleaned))
}

async function assertNoUserOverlap(params: {
  courseId: string
  userIds: string[]
  excludeTrackId?: string | null
}) {
  if (!params.userIds.length) {
    return { ok: true }
  }

  const snapshot = await adminDb
    .collection(COLLECTIONS.tracks)
    .where("courseId", "==", params.courseId)
    .get()

  const selected = new Set(params.userIds)
  const conflicts: string[] = []

  snapshot.docs.forEach((docSnap) => {
    if (params.excludeTrackId && docSnap.id === params.excludeTrackId) {
      return
    }

    const data = docSnap.data()
    const ids = Array.isArray(data.userIds) ? data.userIds : []
    ids.forEach((id: string) => {
      if (selected.has(id)) {
        conflicts.push(id)
      }
    })
  })

  if (conflicts.length) {
    return { ok: false, conflicts: Array.from(new Set(conflicts)) }
  }

  return { ok: true }
}

async function resolveNextOrder(courseId: string) {
  const snapshot = await adminDb
    .collection(COLLECTIONS.tracks)
    .where("courseId", "==", courseId)
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

async function syncCourseEnrollmentsByTracks(courseId: string) {
  const [tracksSnapshot, enrollmentsSnapshot] = await Promise.all([
    adminDb.collection(COLLECTIONS.tracks).where("courseId", "==", courseId).get(),
    adminDb
      .collection(COLLECTIONS.enrollments)
      .where("courseId", "==", courseId)
      .get(),
  ])

  const assignedUserIds = new Set<string>()
  tracksSnapshot.docs.forEach((trackSnap) => {
    const trackData = trackSnap.data()
    const userIds = Array.isArray(trackData?.userIds) ? trackData.userIds : []
    userIds.forEach((id: unknown) => {
      if (typeof id === "string" && id.trim()) {
        assignedUserIds.add(id.trim())
      }
    })
  })

  const enrollmentStates = enrollmentsSnapshot.docs.map((enrollmentSnap) => {
    const enrollmentData = enrollmentSnap.data()
    return {
      userId:
        typeof enrollmentData?.userId === "string"
          ? enrollmentData.userId.trim()
          : "",
      source:
        typeof enrollmentData?.source === "string"
          ? enrollmentData.source
          : "",
    }
  })
  const syncPlan = buildCourseEnrollmentSyncPlan(assignedUserIds, enrollmentStates)

  const now = admin.firestore.FieldValue.serverTimestamp()
  let batch = adminDb.batch()
  let pendingWrites = 0
  let hasMutations = false

  const flushBatch = async () => {
    if (!pendingWrites) {
      return
    }
    await batch.commit()
    batch = adminDb.batch()
    pendingWrites = 0
  }

  for (const userId of syncPlan.userIdsToCreate) {
    const ref = adminDb.collection(COLLECTIONS.enrollments).doc()
    batch.set(ref, {
      userId,
      courseId,
      status: "active",
      progress: 0,
      source: "track_assignment",
      createdAt: now,
      updatedAt: now,
    })
    pendingWrites += 1
    hasMutations = true
    if (pendingWrites >= 450) {
      await flushBatch()
    }
  }

  for (const index of syncPlan.enrollmentIndexesToDelete) {
    batch.delete(enrollmentsSnapshot.docs[index].ref)
    pendingWrites += 1
    hasMutations = true
    if (pendingWrites >= 450) {
      await flushBatch()
    }
  }

  if (hasMutations) {
    await flushBatch()
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
      .collection(COLLECTIONS.tracks)
      .where("courseId", "==", courseId)
      .get()

    const tracks: Track[] = snapshot.docs.map((docSnap) => {
      const data = docSnap.data()
      return {
        id: docSnap.id,
        courseId: data.courseId,
        title: (data.title as string) ?? "",
        description: (data.description as string) ?? "",
        order: Number(data.order ?? 0),
        userIds: Array.isArray(data.userIds) ? data.userIds : [],
      }
    })

    tracks.sort((a, b) => a.order - b.order)

    return NextResponse.json(tracks)
  } catch (err) {
    console.error("list tracks failed", err)
    return NextResponse.json({ error: "Could not list tracks" }, { status: 500 })
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

  const parsedBody = createTrackBodySchema.safeParse(rawBody)
  if (!parsedBody.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const body = parsedBody.data

  const courseId = body.courseId?.trim()
  const title = body.title?.trim() ?? ""
  const description = body.description?.trim() ?? ""
  const userIds = normalizeUserIds(body.userIds)

  if (!courseId || !title || !description) {
    return NextResponse.json(
      { error: "courseId, title and description are required" },
      { status: 400 }
    )
  }

  let order = parseOrder(body.order)
  if (order === null) {
    order = await resolveNextOrder(courseId)
  }

  const overlapCheck = await assertNoUserOverlap({
    courseId,
    userIds,
  })

  if (!overlapCheck.ok) {
    return NextResponse.json(
      {
        error: "userIds already assigned in another track",
        conflicts: overlapCheck.conflicts,
      },
      { status: 409 }
    )
  }

  const now = admin.firestore.FieldValue.serverTimestamp()

  try {
    const ref = adminDb.collection(COLLECTIONS.tracks).doc()

    await ref.set({
      courseId,
      title,
      description,
      order,
      userIds,
      createdAt: now,
      updatedAt: now,
      createdBy: authCheck.uid,
    })

    await syncCourseEnrollmentsByTracks(courseId)

    const result: Track = {
      id: ref.id,
      courseId,
      title,
      description,
      order,
      userIds,
    }

    return NextResponse.json(result, { status: 201 })
  } catch (err) {
    console.error("create track failed", err)
    return NextResponse.json({ error: "Could not create track" }, { status: 500 })
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

  const parsedBody = updateTrackBodySchema.safeParse(rawBody)
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
  let touchedCourseId: string | null = null

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

  if (body.order !== undefined) {
    const order = parseOrder(body.order)
    if (order === null) {
      return NextResponse.json(
        { error: "order must be a positive number" },
        { status: 400 }
      )
    }
    updates.order = order
  }

  if (body.userIds !== undefined) {
    const userIds = normalizeUserIds(body.userIds)
    const trackSnap = await adminDb.collection(COLLECTIONS.tracks).doc(id).get()
    const trackData = trackSnap.data()
    const courseId = (trackData?.courseId as string | undefined) ?? ""

    if (!courseId) {
      return NextResponse.json(
        { error: "courseId not found for track" },
        { status: 400 }
      )
    }

    const overlapCheck = await assertNoUserOverlap({
      courseId,
      userIds,
      excludeTrackId: id,
    })

    if (!overlapCheck.ok) {
      return NextResponse.json(
        {
          error: "userIds already assigned in another track",
          conflicts: overlapCheck.conflicts,
        },
        { status: 409 }
      )
    }

    updates.userIds = userIds
    touchedCourseId = courseId
  }

  try {
    await adminDb.collection(COLLECTIONS.tracks).doc(id).set(updates, {
      merge: true,
    })

    if (touchedCourseId) {
      await syncCourseEnrollmentsByTracks(touchedCourseId)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("update track failed", err)
    return NextResponse.json({ error: "Could not update track" }, { status: 500 })
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

  const parsedBody = deleteTrackBodySchema.safeParse(rawBody)
  if (!parsedBody.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const id = parsedBody.data.id.trim()
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 })
  }

  try {
    const trackRef = adminDb.collection(COLLECTIONS.tracks).doc(id)
    const trackSnap = await trackRef.get()
    if (!trackSnap.exists) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 })
    }

    const trackData = trackSnap.data()
    const courseId = typeof trackData?.courseId === "string" ? trackData.courseId : ""

    const [materialsSnapshot, activitiesSnapshot] = await Promise.all([
      adminDb.collection(COLLECTIONS.materials).where("trackId", "==", id).get(),
      adminDb
        .collection(COLLECTIONS.activities)
        .where("trackId", "==", id)
        .get(),
    ])

    const attachmentUrls = [
      ...extractAttachmentUrlsFromDocs(materialsSnapshot.docs),
      ...extractAttachmentUrlsFromDocs(activitiesSnapshot.docs),
    ]

    await deleteCloudinaryAssetsByUrls(attachmentUrls)
    await deleteDocsInBatches(adminDb, materialsSnapshot.docs)
    await deleteDocsInBatches(adminDb, activitiesSnapshot.docs)
    await trackRef.delete()
    if (courseId) {
      await syncCourseEnrollmentsByTracks(courseId)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("delete track failed", err)
    return NextResponse.json({ error: "Could not delete track" }, { status: 500 })
  }
}
