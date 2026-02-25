import type { Activity } from "@/lib/firebase/types"

const ACTIVITIES_CACHE_TTL = 60_000
const activitiesCache = new Map<string, { data: Activity[]; ts: number }>()

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
  const now = Date.now()
  const cached = activitiesCache.get(cacheKey)
  if (!options?.force && cached && now - cached.ts < ACTIVITIES_CACHE_TTL) {
    return cached.data
  }

  const resp = await fetch(
    `/api/admin/activities?courseId=${encodeURIComponent(courseId)}`,
    {
      headers: {
        ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
      },
    }
  )

  if (!resp.ok) {
    throw new Error("failed to load activities")
  }

  const data = (await resp.json()) as Activity[]
  activitiesCache.set(cacheKey, { data, ts: now })
  return data
}

export async function createAdminActivity(
  idToken: string | null,
  payload: CreateAdminActivityPayload
) {
  const resp = await fetch("/api/admin/activities", {
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

  activitiesCache.clear()
  return (await resp.json()) as Activity
}

export async function deleteAdminActivity(idToken: string | null, id: string) {
  const resp = await fetch("/api/admin/activities", {
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

  activitiesCache.clear()
}
