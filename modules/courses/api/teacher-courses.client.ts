import { adminCourseSummarySchema } from "@/lib/contracts/admin"
import { teacherCourseWorkspaceSchema, type TeacherCourseWorkspace } from "@/lib/contracts/teacher"
import type { AdminCourseSummary } from "@/lib/firebase/types"
import { adminJsonRequest } from "@/lib/api/admin-client"

export function fetchTeacherCourses(idToken: string | null) {
  return adminJsonRequest<AdminCourseSummary[]>("/api/teacher/courses", {
    idToken,
    errorMessage: "failed to load teacher courses",
    schema: adminCourseSummarySchema.array(),
  })
}


export function fetchTeacherCourseWorkspace(
  idToken: string | null,
  courseId: string
) {
  return adminJsonRequest<TeacherCourseWorkspace>(
    `/api/teacher/courses/${encodeURIComponent(courseId)}`,
    {
      idToken,
      errorMessage: "failed to load teacher course workspace",
      schema: teacherCourseWorkspaceSchema,
    }
  )
}
