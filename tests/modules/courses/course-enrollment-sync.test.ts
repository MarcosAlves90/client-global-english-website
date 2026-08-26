import { describe, expect, it } from "vitest"

import { buildCourseEnrollmentSyncPlan } from "@/modules/courses/server/course-enrollment-sync"

describe("buildCourseEnrollmentSyncPlan", () => {
  it("continues reconciling after an enrollment that is still assigned", () => {
    const plan = buildCourseEnrollmentSyncPlan(
      ["assigned-user", "new-user"],
      [
        { userId: "assigned-user", source: "track_assignment" },
        { userId: "stale-user", source: "track_assignment" },
        { userId: "manual-user", source: "manual" },
      ]
    )

    expect(plan.userIdsToCreate).toEqual(["new-user"])
    expect(plan.enrollmentIndexesToDelete).toEqual([1])
  })

  it("does not delete manual enrollments that are no longer track-assigned", () => {
    const plan = buildCourseEnrollmentSyncPlan([], [
      { userId: "manual-user", source: "manual" },
    ])

    expect(plan.userIdsToCreate).toEqual([])
    expect(plan.enrollmentIndexesToDelete).toEqual([])
  })
})
