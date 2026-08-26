import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import { assertHasRole } from "@/lib/firebase/admin-request"
import { canManageCourseAsTeacher } from "@/lib/firebase/teacher-access"
import { loadTeacherGradebook } from "@/modules/courses/server/teacher-gradebook"

export async function GET(req: NextRequest) {
  const authCheck = await assertHasRole(req, ["teacher", "admin"])
  if (!authCheck.ok) {
    return NextResponse.json(
      { error: authCheck.message },
      { status: authCheck.status }
    )
  }

  const { searchParams } = new URL(req.url)
  const courseId = searchParams.get("courseId")?.trim()
  if (!courseId) {
    return NextResponse.json({ error: "courseId is required" }, { status: 400 })
  }

  if (!(await canManageCourseAsTeacher({ ...authCheck, courseId }))) {
    return NextResponse.json({ error: "Course access denied" }, { status: 403 })
  }

  try {
    return NextResponse.json(await loadTeacherGradebook(courseId))
  } catch (error) {
    if (error instanceof Error && error.message === "course-not-found") {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }
    console.error("teacher gradebook load failed", error)
    return NextResponse.json({ error: "Could not load teacher gradebook" }, { status: 500 })
  }
}
