import { adminJsonRequest, getFreshCacheEntry, setCacheEntry } from "@/lib/api/admin-client"
import { adminActivityResponseSchema } from "@/lib/contracts/admin"
import type { AdminActivityResponse } from "@/lib/firebase/types"

const TEACHER_PROGRESS_CACHE_TTL = 30_000
const teacherProgressCache = new Map<
  string,
  { data: AdminActivityResponse[]; ts: number }
>()

export function clearTeacherActivityProgressCache() {
  teacherProgressCache.clear()
}

export async function fetchTeacherActivityProgress(params: {
  idToken: string | null
  courseId: string
  activityId?: string
  force?: boolean
}) {
  const cacheKey = `${params.courseId}:${params.activityId ?? "__all__"}`
  const cached = teacherProgressCache.get(cacheKey)
  const fresh = params.force
    ? null
    : getFreshCacheEntry(cached, TEACHER_PROGRESS_CACHE_TTL)
  if (fresh) return fresh.data

  const query = new URLSearchParams({ courseId: params.courseId })
  if (params.activityId) query.set("activityId", params.activityId)

  const data = await adminJsonRequest<AdminActivityResponse[]>(
    `/api/teacher/activity-progress?${query.toString()}`,
    {
      idToken: params.idToken,
      errorMessage: "failed to load teacher submissions",
      schema: adminActivityResponseSchema.array(),
    }
  )
  teacherProgressCache.set(cacheKey, setCacheEntry(data))
  return data
}

export async function gradeTeacherActivityProgress(params: {
  idToken: string | null
  id: string
  scorePercent: number
  feedback?: string
}) {
  await adminJsonRequest<{ ok: boolean }>("/api/teacher/activity-progress", {
    idToken: params.idToken,
    method: "PATCH",
    body: {
      id: params.id,
      action: "grade",
      scorePercent: params.scorePercent,
      feedback: params.feedback ?? "",
    },
    errorMessage: "failed to save teacher grade",
  })
  clearTeacherActivityProgressCache()
}


export async function requestTeacherActivityRevision(params: {
  idToken: string | null
  id: string
  feedback: string
}) {
  await adminJsonRequest<{ ok: boolean }>("/api/teacher/activity-progress", {
    idToken: params.idToken,
    method: "PATCH",
    body: {
      id: params.id,
      action: "request_revision",
      feedback: params.feedback,
    },
    errorMessage: "failed to request activity revision",
  })
  clearTeacherActivityProgressCache()
}
