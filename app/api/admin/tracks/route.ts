import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import admin, { adminAuth, adminDb } from "@/lib/firebase/admin"
import { COLLECTIONS } from "@/lib/firebase/collections"
import type { Track } from "@/lib/firebase/types"

type CreateTrackBody = {
  id?: string
  courseId?: string
  title?: string
  description?: string
  order?: number
  userIds?: string[]
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

  let body: CreateTrackBody

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

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

  let body: CreateTrackBody

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
  }

  try {
    await adminDb.collection(COLLECTIONS.tracks).doc(id).set(updates, {
      merge: true,
    })

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
    const trackRef = adminDb.collection(COLLECTIONS.tracks).doc(id)
    const trackSnap = await trackRef.get()
    if (!trackSnap.exists) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 })
    }

    const [materialsSnapshot, activitiesSnapshot] = await Promise.all([
      adminDb.collection(COLLECTIONS.materials).where("trackId", "==", id).get(),
      adminDb
        .collection(COLLECTIONS.activities)
        .where("trackId", "==", id)
        .get(),
    ])

    await deleteDocsInBatches(materialsSnapshot.docs)
    await deleteDocsInBatches(activitiesSnapshot.docs)
    await trackRef.delete()

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("delete track failed", err)
    return NextResponse.json({ error: "Could not delete track" }, { status: 500 })
  }
}
