import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import admin, { adminAuth, adminDb } from "@/lib/firebase/admin"
import { deleteCloudinaryAssetsByUrls, isCloudinaryUrl } from "@/lib/cloudinary-admin"
import { COLLECTIONS } from "@/lib/firebase/collections"
import type { Material } from "@/lib/firebase/types"

type CreateMaterialBody = {
  courseId?: string
  trackId?: string
  title?: string
  type?: "pdf" | "video" | "link" | "audio" | "markdown"
  url?: string
  visibility?: "module" | "users" | "private"
  userIds?: string[]
  releaseAt?: string | null
  markdown?: string
  attachments?: { name?: string; url?: string; type?: string }[]
}

type UpdateMaterialBody = {
  id?: string
  title?: string
  trackId?: string
  visibility?: "module" | "users" | "private"
  userIds?: string[]
  releaseAt?: string | null
  markdown?: string
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
const MATERIAL_TYPES = new Set(["pdf", "video", "link", "audio", "markdown"])

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
      .collection(COLLECTIONS.materials)
      .where("courseId", "==", courseId)
      .get()

    const materials: Material[] = snapshot.docs.map((docSnap) => {
      const data = docSnap.data()
      return {
        id: docSnap.id,
        activityId: data.activityId ?? undefined,
        courseId: data.courseId ?? undefined,
        trackId: data.trackId ?? undefined,
        title: data.title ?? "",
        type: data.type ?? undefined,
        url: data.url ?? undefined,
        visibility: data.visibility ?? "private",
        userIds: Array.isArray(data.userIds) ? data.userIds : [],
        releaseAt: data.releaseAt?.toDate?.() ?? null,
        markdown: data.markdown ?? "",
        attachments: Array.isArray(data.attachments) ? data.attachments : [],
      }
    })

    materials.sort((a, b) => a.title.localeCompare(b.title))

    return NextResponse.json(materials)
  } catch (err) {
    console.error("list materials failed", err)
    return NextResponse.json(
      { error: "Could not list materials" },
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

  let body: CreateMaterialBody

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const courseId = body.courseId?.trim()
  const trackId = body.trackId?.trim()
  const title = body.title?.trim() ?? ""
  const type = body.type
  const url = body.url?.trim() ?? ""
  const visibility = body.visibility ?? "private"
  const markdown = typeof body.markdown === "string" ? body.markdown : ""
  const { attachments, invalidUrls } = normalizeAttachments(body.attachments)
  const resolvedType = MATERIAL_TYPES.has(String(type))
    ? (type as CreateMaterialBody["type"])
    : markdown.trim()
    ? "markdown"
    : attachments[0]?.type ?? (url ? "link" : undefined)

  if (!courseId || !trackId || !title) {
    return NextResponse.json(
      { error: "courseId, trackId and title are required" },
      { status: 400 }
    )
  }

  if (invalidUrls.length > 0) {
    return NextResponse.json(
      { error: "attachments must use Cloudinary URLs" },
      { status: 400 }
    )
  }

  if (!url && !markdown.trim() && attachments.length === 0) {
    return NextResponse.json(
      { error: "url, markdown or attachments are required" },
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

  const releaseAt = visibility === "private" ? null : resolveReleaseAt(body.releaseAt)
  const now = admin.firestore.FieldValue.serverTimestamp()

  try {
    const ref = adminDb.collection(COLLECTIONS.materials).doc()

    await ref.set({
      courseId,
      trackId,
      title,
      type: resolvedType ?? null,
      url: url || null,
      visibility,
      userIds: visibility === "users" ? userIds : [],
      releaseAt,
      markdown,
      attachments,
      createdAt: now,
      updatedAt: now,
      createdBy: authCheck.uid,
    })

    const result: Material = {
      id: ref.id,
      courseId,
      trackId,
      title,
      type: resolvedType ?? undefined,
      url: url || undefined,
      visibility,
      userIds: visibility === "users" ? userIds : [],
      releaseAt: releaseAt ? releaseAt.toDate() : null,
      markdown,
      attachments,
    }

    return NextResponse.json(result, { status: 201 })
  } catch (err) {
    console.error("create material failed", err)
    return NextResponse.json(
      { error: "Could not create material" },
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
    const ref = adminDb.collection(COLLECTIONS.materials).doc(id)
    const snap = await ref.get()
    if (!snap.exists) {
      return NextResponse.json({ error: "Material not found" }, { status: 404 })
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
    console.error("delete material failed", err)
    return NextResponse.json(
      { error: "Could not delete material" },
      { status: 500 }
    )
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

  let body: UpdateMaterialBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const id = body.id?.trim()
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 })
  }

  const patch: Record<string, unknown> = {
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedBy: authCheck.uid,
  }

  if (typeof body.title === "string") {
    const normalizedTitle = body.title.trim()
    if (!normalizedTitle) {
      return NextResponse.json({ error: "title cannot be empty" }, { status: 400 })
    }
    patch.title = normalizedTitle
  }

  if (typeof body.trackId === "string") {
    const normalizedTrackId = body.trackId.trim()
    if (!normalizedTrackId) {
      return NextResponse.json({ error: "trackId cannot be empty" }, { status: 400 })
    }
    patch.trackId = normalizedTrackId
  }

  if (typeof body.visibility === "string") {
    if (!["module", "users", "private"].includes(body.visibility)) {
      return NextResponse.json({ error: "invalid visibility" }, { status: 400 })
    }
    patch.visibility = body.visibility
    if (body.visibility === "users") {
      const userIds = normalizeUserIds(body.userIds)
      if (!userIds.length) {
        return NextResponse.json(
          { error: "userIds are required for users visibility" },
          { status: 400 }
        )
      }
      patch.userIds = userIds
    } else {
      patch.userIds = []
    }
  } else if (Array.isArray(body.userIds)) {
    patch.userIds = normalizeUserIds(body.userIds)
  }

  if (body.releaseAt !== undefined) {
    patch.releaseAt = resolveReleaseAt(body.releaseAt)
  }

  if (typeof body.markdown === "string") {
    patch.markdown = body.markdown
    if (body.markdown.trim()) {
      patch.type = "markdown"
    }
  }

  if (Object.keys(patch).length <= 2) {
    return NextResponse.json({ error: "no fields to update" }, { status: 400 })
  }

  try {
    const ref = adminDb.collection(COLLECTIONS.materials).doc(id)
    const snap = await ref.get()
    if (!snap.exists) {
      return NextResponse.json({ error: "Material not found" }, { status: 404 })
    }

    await ref.update(patch)
    const updatedSnap = await ref.get()
    const data = updatedSnap.data()

    const result: Material = {
      id: updatedSnap.id,
      activityId: data?.activityId ?? undefined,
      courseId: data?.courseId ?? undefined,
      trackId: data?.trackId ?? undefined,
      title: data?.title ?? "",
      type: data?.type ?? undefined,
      url: data?.url ?? undefined,
      visibility: data?.visibility ?? "private",
      userIds: Array.isArray(data?.userIds) ? data?.userIds : [],
      releaseAt: data?.releaseAt?.toDate?.() ?? null,
      markdown: data?.markdown ?? "",
      attachments: Array.isArray(data?.attachments) ? data?.attachments : [],
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error("update material failed", err)
    return NextResponse.json(
      { error: "Could not update material" },
      { status: 500 }
    )
  }
}
