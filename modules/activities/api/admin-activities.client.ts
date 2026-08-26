import type { Activity, ActivityQuestion, MediaAttachment } from "@/lib/firebase/types"
import { activitySchema } from "@/lib/contracts/admin"
import {
  adminJsonRequest,
  getFreshCacheEntry,
  setCacheEntry,
} from "@/lib/api/admin-client"

const ACTIVITIES_CACHE_TTL = 60_000
const activitiesCache = new Map<string, { data: Activity[]; ts: number }>()

export function clearAdminActivitiesCache() {
  activitiesCache.clear()
}

export type CreateCourseActivityPayload = {
  courseId: string
  trackId: string
  title: string
  type: "lesson" | "quiz" | "assignment" | "project"
  order?: number
  estimatedMinutes: number
  visibility: "module" | "users" | "private"
  userIds?: string[]
  releaseAt?: string | null
  dueAt?: string | null
  closeAt?: string | null
  attachments?: MediaAttachment[]
  questions?: ActivityQuestion[]
}

export async function fetchAdminCourseActivities(
  idToken: string | null,
  courseId: string,
  options?: { force?: boolean }
) {
  const cacheKey = courseId
  const cached = activitiesCache.get(cacheKey)
  const fresh = options?.force ? null : getFreshCacheEntry(cached, ACTIVITIES_CACHE_TTL)
  if (fresh) {
    return fresh.data
  }

  const data = await adminJsonRequest<Activity[]>(
    `/api/admin/activities?courseId=${encodeURIComponent(courseId)}`,
    {
      idToken,
      errorMessage: "failed to load activities",
      schema: activitySchema.array(),
    }
  )
  activitiesCache.set(cacheKey, setCacheEntry(data))
  return data
}

export async function createCourseActivity(
  idToken: string | null,
  payload: CreateCourseActivityPayload
) {
  const result = await adminJsonRequest<Activity>("/api/admin/activities", {
    idToken,
    method: "POST",
    body: payload,
    errorMessage: "create failed",
    schema: activitySchema,
  })

  clearAdminActivitiesCache()
  return result
}

export type UpdateAdminActivityPayload = {
  id: string
  attachments: MediaAttachment[]
}

export async function updateAdminActivity(
  idToken: string | null,
  payload: UpdateAdminActivityPayload
) {
  const result = await adminJsonRequest<Activity>("/api/admin/activities", {
    idToken,
    method: "PATCH",
    body: payload,
    errorMessage: "update failed",
    schema: activitySchema,
  })

  clearAdminActivitiesCache()
  return result
}

export type CreateAdminActivityPayload = CreateCourseActivityPayload
export const createAdminActivity = createCourseActivity

export async function deleteAdminActivity(idToken: string | null, id: string) {
  await adminJsonRequest<void>("/api/admin/activities", {
    idToken,
    method: "DELETE",
    body: { id },
    errorMessage: "delete failed",
  })

  clearAdminActivitiesCache()
}
