import type { AdminActivityResponse } from "@/lib/firebase/types"

const ACTIVITY_PROGRESS_CACHE_TTL = 60_000
const activityProgressCache = new Map<
  string,
  { data: AdminActivityResponse[]; ts: number }
>()

export function clearAdminActivityProgressCache() {
  activityProgressCache.clear()
}

export async function fetchAdminActivityProgress(params: {
  idToken: string | null
  courseId: string
  activityId?: string
  force?: boolean
}) {
  const cacheKey = `${params.courseId}:${params.activityId ?? "__all__"}`
  const now = Date.now()
  const cached = activityProgressCache.get(cacheKey)
  if (!params.force && cached && now - cached.ts < ACTIVITY_PROGRESS_CACHE_TTL) {
    return cached.data
  }

  const query = new URLSearchParams({ courseId: params.courseId })
  if (params.activityId) {
    query.set("activityId", params.activityId)
  }

  const resp = await fetch(`/api/admin/activity-progress?${query.toString()}`, {
    headers: {
      ...(params.idToken ? { Authorization: `Bearer ${params.idToken}` } : {}),
    },
  })

  if (!resp.ok) {
    throw new Error("failed to load activity progress")
  }

  const data = (await resp.json()) as AdminActivityResponse[]
  activityProgressCache.set(cacheKey, { data, ts: now })
  return data
}
