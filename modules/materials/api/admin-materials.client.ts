import type { Material } from "@/lib/firebase/types"
import { materialSchema } from "@/lib/contracts/admin"
import {
  adminJsonRequest,
  getFreshCacheEntry,
  setCacheEntry,
} from "@/lib/api/admin-client"

const MATERIALS_CACHE_TTL = 60_000
const materialsCache = new Map<string, { data: Material[]; ts: number }>()

export function clearAdminMaterialsCache() {
  materialsCache.clear()
}

export type CreateAdminMaterialPayload = {
  courseId: string
  trackId: string
  title: string
  type?: "pdf" | "video" | "link" | "audio"
  url?: string
  visibility: "module" | "users" | "private"
  userIds?: string[]
  releaseAt?: string | null
  markdown?: string
  attachments?: { name: string; url: string; type?: "pdf" | "video" | "link" | "audio" }[]
}

export type UpdateAdminMaterialPayload = {
  id: string
  title?: string
  trackId?: string
  visibility?: "module" | "users" | "private"
  userIds?: string[]
  releaseAt?: string | null
  markdown?: string
  attachments?: { name: string; url: string; type?: "pdf" | "video" | "link" | "audio" }[]
}

export async function fetchAdminCourseMaterials(
  idToken: string | null,
  courseId: string,
  options?: { force?: boolean }
) {
  const cacheKey = courseId
  const cached = materialsCache.get(cacheKey)
  const fresh = options?.force ? null : getFreshCacheEntry(cached, MATERIALS_CACHE_TTL)
  if (fresh) {
    return fresh.data
  }

  const data = await adminJsonRequest<Material[]>(
    `/api/admin/materials?courseId=${encodeURIComponent(courseId)}`,
    {
      idToken,
      errorMessage: "failed to load materials",
      schema: materialSchema.array(),
    }
  )
  materialsCache.set(cacheKey, setCacheEntry(data))
  return data
}

export async function createAdminMaterial(
  idToken: string | null,
  payload: CreateAdminMaterialPayload
) {
  const result = await adminJsonRequest<Material>("/api/admin/materials", {
    idToken,
    method: "POST",
    body: payload,
    errorMessage: "create failed",
    schema: materialSchema,
  })

  clearAdminMaterialsCache()
  return result
}

export async function deleteAdminMaterial(idToken: string | null, id: string) {
  await adminJsonRequest<void>("/api/admin/materials", {
    idToken,
    method: "DELETE",
    body: { id },
    errorMessage: "delete failed",
  })

  clearAdminMaterialsCache()
}

export async function updateAdminMaterial(
  idToken: string | null,
  payload: UpdateAdminMaterialPayload
) {
  const result = await adminJsonRequest<Material>("/api/admin/materials", {
    idToken,
    method: "PATCH",
    body: payload,
    errorMessage: "update failed",
    schema: materialSchema,
  })

  clearAdminMaterialsCache()
  return result
}
