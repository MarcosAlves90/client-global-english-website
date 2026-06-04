import type { Activity } from "@/lib/firebase/types"
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

export type CreateAdminActivityPayload = {
  courseId: string
  trackId: string
  title: string
  type: "lesson" | "quiz" | "assignment" | "project"
  order?: number
  estimatedMinutes: number
  visibility: "module" | "users" | "private"
  userIds?: string[]
  releaseAt?: string | null
  attachments?: { name: string; url: string; type?: "pdf" | "video" | "link" | "audio" }[]
  questions?: {
    id: string
    type: "essay" | "single_choice" | "multiple_choice" | "true_false" | "short_answer"
    prompt: string
    options?: string[]
    correctAnswers?: string[]
    points?: number
    required?: boolean
  }[]
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
    }
  )
  activitiesCache.set(cacheKey, setCacheEntry(data))
  return data
}

export async function createAdminActivity(
  idToken: string | null,
  payload: CreateAdminActivityPayload
) {
  const result = await adminJsonRequest<Activity>("/api/admin/activities", {
    idToken,
    method: "POST",
    body: payload,
    errorMessage: "create failed",
  })

  clearAdminActivitiesCache()
  return result
}

export async function deleteAdminActivity(idToken: string | null, id: string) {
  await adminJsonRequest<void>("/api/admin/activities", {
    idToken,
    method: "DELETE",
    body: { id },
    errorMessage: "delete failed",
  })

  clearAdminActivitiesCache()
}
