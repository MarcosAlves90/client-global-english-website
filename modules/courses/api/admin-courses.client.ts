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

export async function fetchAdminCourses(idToken: string | null) {
  const resp = await fetch("/api/admin/courses", {
    headers: {
      ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
    },
  })

  if (!resp.ok) {
    throw new Error("failed to load")
  }

  return (await resp.json()) as AdminCourseSummary[]
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
}
