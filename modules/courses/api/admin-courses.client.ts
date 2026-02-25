import type { AdminCourseSummary } from "@/lib/firebase/types"

type SaveCoursePayload = {
  id?: string
  title: string
  description: string
  level: "Beginner" | "Intermediate" | "Advanced"
  durationWeeks: number
  coverUrl: string | null
  status: string
}

const COURSES_CACHE_TTL = 60_000
let coursesCache: { data: AdminCourseSummary[]; ts: number } | null = null

export async function fetchAdminCourses(
  idToken: string | null,
  options?: { force?: boolean }
) {
  if (!options?.force && coursesCache) {
    if (Date.now() - coursesCache.ts < COURSES_CACHE_TTL) {
      return coursesCache.data
    }
  }

  const resp = await fetch("/api/admin/courses", {
    headers: {
      ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
    },
  })

  if (!resp.ok) {
    throw new Error("failed to load")
  }

  const data = (await resp.json()) as AdminCourseSummary[]
  coursesCache = { data, ts: Date.now() }
  return data
}

export async function saveAdminCourse(
  idToken: string | null,
  payload: SaveCoursePayload
) {
  const resp = await fetch("/api/admin/courses", {
    method: payload.id ? "PATCH" : "POST",
    headers: {
      "Content-Type": "application/json",
      ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
    },
    body: JSON.stringify(payload),
  })

  if (!resp.ok) {
    throw new Error("save failed")
  }

  coursesCache = null
}

export async function deleteAdminCourse(idToken: string | null, id: string) {
  const resp = await fetch("/api/admin/courses", {
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

  coursesCache = null
}
