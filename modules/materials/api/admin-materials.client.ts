import type { Material } from "@/lib/firebase/types"

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
}

export async function fetchAdminCourseMaterials(
  idToken: string | null,
  courseId: string,
  options?: { force?: boolean }
) {
  const cacheKey = courseId
  const now = Date.now()
  const cached = materialsCache.get(cacheKey)
  if (!options?.force && cached && now - cached.ts < MATERIALS_CACHE_TTL) {
    return cached.data
  }

  const resp = await fetch(
    `/api/admin/materials?courseId=${encodeURIComponent(courseId)}`,
    {
      headers: {
        ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
      },
    }
  )

  if (!resp.ok) {
    throw new Error("failed to load materials")
  }

  const data = (await resp.json()) as Material[]
  materialsCache.set(cacheKey, { data, ts: now })
  return data
}

export async function createAdminMaterial(
  idToken: string | null,
  payload: CreateAdminMaterialPayload
) {
  const resp = await fetch("/api/admin/materials", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
    },
    body: JSON.stringify(payload),
  })

  if (!resp.ok) {
    throw new Error("create failed")
  }

  clearAdminMaterialsCache()
  return (await resp.json()) as Material
}

export async function deleteAdminMaterial(idToken: string | null, id: string) {
  const resp = await fetch("/api/admin/materials", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
    },
    body: JSON.stringify({ id }),
  })

  if (!resp.ok) {
    throw new Error("delete failed")
  }

  clearAdminMaterialsCache()
}

export async function updateAdminMaterial(
  idToken: string | null,
  payload: UpdateAdminMaterialPayload
) {
  const resp = await fetch("/api/admin/materials", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
    },
    body: JSON.stringify(payload),
  })

  if (!resp.ok) {
    throw new Error("update failed")
  }

  clearAdminMaterialsCache()
  return (await resp.json()) as Material
}

