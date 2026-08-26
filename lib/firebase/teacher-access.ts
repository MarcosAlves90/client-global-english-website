import { isTeacherAssignedToCourse } from "@/lib/auth/course-access"
import { adminDb } from "@/lib/firebase/admin"
import { COLLECTIONS } from "@/lib/firebase/collections"
import type { UserRole } from "@/lib/firebase/types"

export async function canManageCourseAsTeacher(params: {
  uid: string
  role: UserRole
  courseId: string
}) {
  if (params.role === "admin") return true
  if (params.role !== "teacher") return false

  const courseSnapshot = await adminDb
    .collection(COLLECTIONS.courses)
    .doc(params.courseId)
    .get()
  if (!courseSnapshot.exists) return false

  return isTeacherAssignedToCourse(
    courseSnapshot.data()?.teacherIds,
    params.uid
  )
}
