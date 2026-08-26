export function isTeacherAssignedToCourse(
  teacherIds: unknown,
  uid: string
) {
  if (!uid || !Array.isArray(teacherIds)) return false

  return teacherIds.some(
    (value) => typeof value === "string" && value.trim() === uid
  )
}

export function areUsersEnrolledInCourse(
  selectedUserIds: string[],
  enrollmentUserIds: unknown[]
) {
  if (selectedUserIds.length === 0) return true

  const enrolled = new Set(
    enrollmentUserIds
      .filter((value): value is string => typeof value === "string")
      .map((value) => value.trim())
      .filter(Boolean)
  )

  return selectedUserIds.every((uid) => enrolled.has(uid.trim()))
}
