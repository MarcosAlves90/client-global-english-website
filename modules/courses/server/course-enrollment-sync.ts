type EnrollmentState = {
  userId: string
  source: string
}

export function buildCourseEnrollmentSyncPlan(
  assignedUserIds: Iterable<string>,
  enrollments: EnrollmentState[]
) {
  const assigned = new Set(
    Array.from(assignedUserIds, (userId) => userId.trim()).filter(Boolean)
  )
  const existingUserIds = new Set(
    enrollments.map((enrollment) => enrollment.userId.trim()).filter(Boolean)
  )

  const userIdsToCreate = Array.from(assigned).filter(
    (userId) => !existingUserIds.has(userId)
  )
  const enrollmentIndexesToDelete: number[] = []

  enrollments.forEach((enrollment, index) => {
    const userId = enrollment.userId.trim()
    if (!userId || assigned.has(userId)) {
      return
    }
    if (enrollment.source === "track_assignment") {
      enrollmentIndexesToDelete.push(index)
    }
  })

  return { userIdsToCreate, enrollmentIndexesToDelete }
}
