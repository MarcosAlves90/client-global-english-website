import type { Track } from "@/lib/firebase/types"

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
  const now = Date.now()
  const cached = tracksCache.get(cacheKey)
  if (!options?.force && cached && now - cached.ts < TRACKS_CACHE_TTL) {
    return cached.data
  }

  const resp = await fetch(`/api/admin/tracks?courseId=${encodeURIComponent(courseId)}`, {
    headers: {
      ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
    },
  })

  if (!resp.ok) {
    throw new Error("failed to load tracks")
  }

  const data = (await resp.json()) as Track[]
  tracksCache.set(cacheKey, { data, ts: now })
  return data
}

export async function createAdminCourseTrack(
  idToken: string | null,
  payload: CreateTrackPayload
) {
  const resp = await fetch("/api/admin/tracks", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
    },
    body: JSON.stringify(payload),
  })

  if (!resp.ok) {
    if (resp.status === 409) {
      throw new Error("USER_CONFLICT")
    }
    throw new Error("create failed")
  }

  tracksCache.clear()
  return (await resp.json()) as Track
}

export async function updateAdminCourseTrack(
  idToken: string | null,
  payload: UpdateTrackPayload
) {
  const resp = await fetch("/api/admin/tracks", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
    },
    body: JSON.stringify(payload),
  })

  if (!resp.ok) {
    if (resp.status === 409) {
      throw new Error("USER_CONFLICT")
    }
    throw new Error("update failed")
  }

  tracksCache.clear()
}

export async function deleteAdminCourseTrack(
  idToken: string | null,
  id: string
) {
  const resp = await fetch("/api/admin/tracks", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
    },
    body: JSON.stringify({ id }),
  })

  if (!resp.ok) {
    if (resp.status === 409) {
      throw new Error("USER_CONFLICT")
    }
    throw new Error("delete failed")
  }

  tracksCache.clear()
}
