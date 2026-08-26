import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import admin, { adminDb } from "@/lib/firebase/admin"
import { assertIsAdmin } from "@/lib/firebase/admin-request"
import {
  deleteCloudinaryAssetsByUrls,
  isCloudinaryUrl,
} from "@/lib/cloudinary-admin"
import {
  normalizeCloudinaryUrlItems,
  normalizeCloudinaryUrlValue,
} from "@/lib/cloudinary-url"
import { COLLECTIONS } from "@/lib/firebase/collections"
import {
  createMaterialBodySchema,
  deleteMaterialBodySchema,
  updateMaterialBodySchema,
} from "@/lib/contracts/admin"
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
  attachments?: { name?: string; url?: string; type?: string }[]
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

function isMaterialType(value: unknown): value is NonNullable<Material["type"]> {
  return typeof value === "string" && MATERIAL_TYPES.has(value)
}

function isMaterialVisibility(
  value: unknown
): value is NonNullable<Material["visibility"]> {
  return value === "module" || value === "users" || value === "private"
}

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

function mapMaterialDoc(docSnap: {
  id: string
  data: () => Record<string, unknown> | undefined
}): Material {
  const data = docSnap.data() ?? {}
  const type = isMaterialType(data.type) ? data.type : undefined
  const visibility = isMaterialVisibility(data.visibility) ? data.visibility : "private"

  return {
    id: docSnap.id,
    activityId: typeof data.activityId === "string" ? data.activityId : undefined,
    courseId: typeof data.courseId === "string" ? data.courseId : undefined,
    trackId: typeof data.trackId === "string" ? data.trackId : undefined,
    title: typeof data.title === "string" ? data.title : "",
    type,
    url:
      normalizeCloudinaryUrlValue(
        typeof data.url === "string" ? data.url : null
      ) ?? undefined,
    visibility,
    userIds: Array.isArray(data.userIds) ? data.userIds : [],
    releaseAt: data.releaseAt && typeof data.releaseAt === "object" && "toDate" in data.releaseAt
      ? (data.releaseAt as { toDate: () => Date }).toDate()
      : null,
    markdown: typeof data.markdown === "string" ? data.markdown : "",
    attachments: normalizeCloudinaryUrlItems(
      Array.isArray(data.attachments) ? data.attachments : []
    ),
  }
}

function normalizeMaterialUrl(url?: string | null) {
  const trimmed = url?.trim() ?? ""
  if (!trimmed) return ""
  return isCloudinaryUrl(trimmed) ? normalizeCloudinaryUrlValue(trimmed) ?? "" : trimmed
}

function resolveMaterialType(params: {
  type?: CreateMaterialBody["type"]
  markdown: string
  attachments: { type?: string }[]
  url: string
}): Material["type"] | undefined {
  const { type, markdown, attachments, url } = params

  if (isMaterialType(type)) {
    return type
  }

  if (markdown.trim()) {
    return "markdown"
  }

  const attachmentType = attachments[0]?.type
  if (isMaterialType(attachmentType)) {
    return attachmentType
  }

  if (url) {
    return "link"
  }

  return undefined
}

function buildCreateMaterialContext(body: CreateMaterialBody) {
  const courseId = body.courseId?.trim()
  const trackId = body.trackId?.trim()
  const title = body.title?.trim() ?? ""
  const rawUrl = body.url?.trim() ?? ""
  const url = normalizeMaterialUrl(rawUrl)
  const visibility = body.visibility ?? "private"
  const markdown = typeof body.markdown === "string" ? body.markdown : ""
  const { attachments, invalidUrls } = normalizeAttachments(body.attachments)
  const type = resolveMaterialType({
    type: body.type,
    markdown,
    attachments,
    url,
  })
  const releaseAt = visibility === "private" ? null : resolveReleaseAt(body.releaseAt)
  const userIds = normalizeUserIds(body.userIds)

  if (!courseId || !trackId || !title) {
    return {
      error: "courseId, trackId and title are required",
      status: 400,
    } as const
  }

  if (invalidUrls.length > 0) {
    return {
      error: "attachments must use Cloudinary URLs",
      status: 400,
    } as const
  }

  if (!url && !markdown.trim() && attachments.length === 0) {
    return {
      error: "url, markdown or attachments are required",
      status: 400,
    } as const
  }

  if (visibility === "users" && userIds.length === 0) {
    return {
      error: "userIds are required for users visibility",
      status: 400,
    } as const
  }

  return {
    courseId,
    trackId,
    title,
    type,
    url,
    visibility,
    markdown,
    attachments,
    releaseAt,
    userIds,
  } as const
}

function addPatchStringField(
  patch: Record<string, unknown>,
  key: string,
  value: unknown,
  options?: { required?: boolean }
) {
  if (typeof value !== "string") {
    return null
  }

  const normalized = value.trim()
  if (!normalized && options?.required) {
    return `${key} cannot be empty`
  }

  patch[key] = normalized
  return null
}

function applyMaterialVisibilityPatch(
  patch: Record<string, unknown>,
  visibility: string,
  userIds?: string[]
) {
  if (!["module", "users", "private"].includes(visibility)) {
    return "invalid visibility"
  }

  patch.visibility = visibility
  if (visibility === "users") {
    const normalizedUserIds = normalizeUserIds(userIds)
    if (!normalizedUserIds.length) {
      return "userIds are required for users visibility"
    }
    patch.userIds = normalizedUserIds
  } else {
    patch.userIds = []
  }

  return null
}

function applyMaterialMarkdownPatch(
  patch: Record<string, unknown>,
  markdown?: string
) {
  if (typeof markdown !== "string") {
    return
  }

  patch.markdown = markdown
  if (markdown.trim()) {
    patch.type = "markdown"
  }
}

function buildUpdateMaterialPatch(body: UpdateMaterialBody) {
  const patch: Record<string, unknown> = {
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }

  const titleError = addPatchStringField(patch, "title", body.title, { required: true })
  if (titleError) {
    return { error: titleError, status: 400 } as const
  }

  const trackIdError = addPatchStringField(patch, "trackId", body.trackId, { required: true })
  if (trackIdError) {
    return { error: trackIdError, status: 400 } as const
  }

  if (typeof body.visibility === "string") {
    const visibilityError = applyMaterialVisibilityPatch(patch, body.visibility, body.userIds)
    if (visibilityError) {
      return { error: visibilityError, status: 400 } as const
    }
  } else if (Array.isArray(body.userIds)) {
    patch.userIds = normalizeUserIds(body.userIds)
  }

  if (body.releaseAt !== undefined) {
    patch.releaseAt = resolveReleaseAt(body.releaseAt)
  }

  applyMaterialMarkdownPatch(patch, body.markdown)

  if (body.attachments !== undefined) {
    const { attachments, invalidUrls } = normalizeAttachments(body.attachments)
    if (invalidUrls.length > 0) {
      return { error: "attachments must use Cloudinary URLs", status: 400 } as const
    }
    patch.attachments = attachments
  }

  return { patch } as const
}

function hasMeaningfulPatch(patch: Record<string, unknown>) {
  return Object.keys(patch).length > 2
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
        url: normalizeCloudinaryUrlValue(data.url ?? null) ?? undefined,
        visibility: data.visibility ?? "private",
        userIds: Array.isArray(data.userIds) ? data.userIds : [],
        releaseAt: data.releaseAt?.toDate?.() ?? null,
        markdown: data.markdown ?? "",
        attachments: normalizeCloudinaryUrlItems(
          Array.isArray(data.attachments) ? data.attachments : []
        ),
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

  let rawBody: unknown

  try {
    rawBody = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsedBody = createMaterialBodySchema.safeParse(rawBody)
  if (!parsedBody.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const body = parsedBody.data
  const context = buildCreateMaterialContext(body)
  if ("error" in context) {
    return NextResponse.json({ error: context.error }, { status: context.status })
  }

  const now = admin.firestore.FieldValue.serverTimestamp()

  try {
    const ref = adminDb.collection(COLLECTIONS.materials).doc()

    await ref.set({
      courseId: context.courseId,
      trackId: context.trackId,
      title: context.title,
      type: context.type ?? null,
      url: context.url || null,
      visibility: context.visibility,
      userIds: context.visibility === "users" ? context.userIds : [],
      releaseAt: context.releaseAt,
      markdown: context.markdown,
      attachments: context.attachments,
      createdAt: now,
      updatedAt: now,
      createdBy: authCheck.uid,
    })

    const result: Material = {
      id: ref.id,
      courseId: context.courseId,
      trackId: context.trackId,
      title: context.title,
      type: context.type ?? undefined,
      url: context.url || undefined,
      visibility: context.visibility,
      userIds: context.visibility === "users" ? context.userIds : [],
      releaseAt: context.releaseAt ? context.releaseAt.toDate() : null,
      markdown: context.markdown,
      attachments: context.attachments,
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

  let rawBody: unknown

  try {
    rawBody = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsedBody = deleteMaterialBodySchema.safeParse(rawBody)
  if (!parsedBody.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const id = parsedBody.data.id.trim()
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

  let rawBody: unknown
  try {
    rawBody = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsedBody = updateMaterialBodySchema.safeParse(rawBody)
  if (!parsedBody.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const body = parsedBody.data

  const id = body.id?.trim()
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 })
  }
  const patchContext = buildUpdateMaterialPatch(body)
  if ("error" in patchContext) {
    return NextResponse.json({ error: patchContext.error }, { status: patchContext.status })
  }

  const patch = {
    ...patchContext.patch,
    updatedBy: authCheck.uid,
  }

  if (!hasMeaningfulPatch(patch)) {
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
    return NextResponse.json(mapMaterialDoc(updatedSnap))
  } catch (err) {
    console.error("update material failed", err)
    return NextResponse.json(
      { error: "Could not update material" },
      { status: 500 }
    )
  }
}
