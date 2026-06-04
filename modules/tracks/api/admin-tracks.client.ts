import type { Track } from "@/lib/firebase/types"
import {
  adminJsonRequest,
  getFreshCacheEntry,
  setCacheEntry,
} from "@/lib/api/admin-client"

const TRACKS_CACHE_TTL = 60_000
const tracksCache = new Map<string, { data: Track[]; ts: number }>()

type CreateTrackPayload = {
  courseId: string
  title: string
  description: string
  order?: number
  userIds?: string[]
}

type UpdateTrackPayload = {
  id: string
  title: string
  description: string
  order?: number
  userIds?: string[]
}

export async function fetchAdminCourseTracks(
  idToken: string | null,
  courseId: string,
  options?: { force?: boolean }
) {
  const cacheKey = courseId
  const cached = tracksCache.get(cacheKey)
  const fresh = options?.force ? null : getFreshCacheEntry(cached, TRACKS_CACHE_TTL)
  if (fresh) {
    return fresh.data
  }

  const data = await adminJsonRequest<Track[]>(
    `/api/admin/tracks?courseId=${encodeURIComponent(courseId)}`,
    {
      idToken,
      errorMessage: "failed to load tracks",
    }
  )
  tracksCache.set(cacheKey, setCacheEntry(data))
  return data
}

export async function createAdminCourseTrack(
  idToken: string | null,
  payload: CreateTrackPayload
) {
  const result = await adminJsonRequest<Track>("/api/admin/tracks", {
    idToken,
    method: "POST",
    body: payload,
    errorMessage: (response) =>
      response.status === 409 ? "USER_CONFLICT" : "create failed",
  })

  tracksCache.clear()
  return result
}

export async function updateAdminCourseTrack(
  idToken: string | null,
  payload: UpdateTrackPayload
) {
  await adminJsonRequest<void>("/api/admin/tracks", {
    idToken,
    method: "PATCH",
    body: payload,
    errorMessage: (response) =>
      response.status === 409 ? "USER_CONFLICT" : "update failed",
  })

  tracksCache.clear()
}

export async function deleteAdminCourseTrack(
  idToken: string | null,
  id: string
) {
  await adminJsonRequest<void>("/api/admin/tracks", {
    idToken,
    method: "DELETE",
    body: { id },
    errorMessage: (response) =>
      response.status === 409 ? "USER_CONFLICT" : "delete failed",
  })

  tracksCache.clear()
}
