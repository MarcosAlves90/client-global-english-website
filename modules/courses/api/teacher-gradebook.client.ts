import { adminJsonRequest, getFreshCacheEntry, setCacheEntry } from "@/lib/api/admin-client"
import { teacherGradebookSchema } from "@/lib/contracts/admin"
import type { TeacherGradebook } from "@/lib/firebase/types"

const TEACHER_GRADEBOOK_CACHE_TTL = 30_000
const teacherGradebookCache = new Map<
  string,
  { data: TeacherGradebook; ts: number }
>()

export function clearTeacherGradebookCache() {
  teacherGradebookCache.clear()
}

export async function fetchTeacherGradebook(params: {
  idToken: string | null
  courseId: string
  force?: boolean
}) {
  const cached = teacherGradebookCache.get(params.courseId)
  const fresh = params.force
    ? null
    : getFreshCacheEntry(cached, TEACHER_GRADEBOOK_CACHE_TTL)
  if (fresh) return fresh.data

  const query = new URLSearchParams({ courseId: params.courseId })
  const data = await adminJsonRequest<TeacherGradebook>(
    `/api/teacher/gradebook?${query.toString()}`,
    {
      idToken: params.idToken,
      errorMessage: "failed to load teacher gradebook",
      schema: teacherGradebookSchema,
    }
  )
  teacherGradebookCache.set(params.courseId, setCacheEntry(data))
  return data
}
