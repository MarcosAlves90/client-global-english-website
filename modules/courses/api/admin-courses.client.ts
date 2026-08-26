import type {
  AdminCourseCatalog,
  AdminCourseSummary,
} from "@/lib/firebase/types"
import { adminCourseCatalogSchema } from "@/lib/contracts/admin"
import {
  adminJsonRequest,
  getFreshCacheEntry,
  setCacheEntry,
} from "@/lib/api/admin-client"

type SaveCoursePayload = {
  id?: string
  title: string
  description: string
  level: "Beginner" | "Intermediate" | "Advanced"
  durationWeeks: number
  coverUrl: string | null
  status: string
  teacherIds?: string[]
}

const COURSES_CACHE_TTL = 60_000
let coursesCache: { data: AdminCourseCatalog; ts: number } | null = null

export async function fetchAdminCourseCatalog(
  idToken: string | null,
  options?: { force?: boolean }
) {
  const cached = options?.force
    ? null
    : getFreshCacheEntry(coursesCache, COURSES_CACHE_TTL)
  if (cached) {
    return cached.data
  }

  const data = await adminJsonRequest<AdminCourseCatalog>(
    "/api/admin/courses?includeMetrics=true",
    {
      idToken,
      errorMessage: "failed to load",
      schema: adminCourseCatalogSchema,
    }
  )
  coursesCache = setCacheEntry(data)
  return data
}

export async function fetchAdminCourses(
  idToken: string | null,
  options?: { force?: boolean }
): Promise<AdminCourseSummary[]> {
  const catalog = await fetchAdminCourseCatalog(idToken, options)
  return catalog.items
}

export async function saveAdminCourse(
  idToken: string | null,
  payload: SaveCoursePayload
) {
  await adminJsonRequest<void>("/api/admin/courses", {
    idToken,
    method: payload.id ? "PATCH" : "POST",
    body: payload,
    errorMessage: "save failed",
  })

  coursesCache = null
}

export async function deleteAdminCourse(idToken: string | null, id: string) {
  await adminJsonRequest<void>("/api/admin/courses", {
    idToken,
    method: "DELETE",
    body: { id },
    errorMessage: "delete failed",
  })

  coursesCache = null
}
