import { describe, expect, it } from "vitest"

import {
  getActivityAudienceSize,
  getActivityCompletionPercent,
  getAverageActivityScore,
} from "@/modules/courses/model/activity-insights"
import type { AdminActivityResponse } from "@/lib/firebase/types"

function response(
  userId: string,
  status: AdminActivityResponse["status"],
  scorePercent: number | null
): AdminActivityResponse {
  return {
    id: `${userId}-activity-1`,
    userId,
    activityId: "activity-1",
    courseId: "course-1",
    trackId: "track-1",
    status,
    answers: {},
    answeredCount: 0,
    totalQuestions: 0,
    completionPercent: status === "completed" ? 100 : 50,
    scorePercent,
    gradingStatus: "pending",
    teacherScorePercent: null,
    teacherFeedback: null,
    gradedBy: null,
    gradedAt: null,
    submittedAt: null,
    createdAt: null,
    updatedAt: null,
  }
}

describe("activity insight metrics", () => {
  it("uses the actual activity audience as the completion denominator", () => {
    const audienceSize = getActivityAudienceSize({
      activity: {
        trackId: "track-1",
        visibility: "users",
        userIds: ["user-1", "user-2", "user-2", "user-3"],
      },
      track: { userIds: [] },
      courseStudentCount: 20,
    })

    expect(audienceSize).toBe(3)
    expect(
      getActivityCompletionPercent(
        [response("user-1", "completed", 80)],
        audienceSize
      )
    ).toBe(33)
  })

  it("uses track assignments or course audience for module visibility", () => {
    expect(
      getActivityAudienceSize({
        activity: { trackId: "track-1", visibility: "module" },
        track: { userIds: ["user-1", "user-2"] },
        courseStudentCount: 10,
      })
    ).toBe(2)

    expect(
      getActivityAudienceSize({
        activity: { trackId: "track-1", visibility: "module" },
        track: { userIds: [] },
        courseStudentCount: 10,
      })
    ).toBe(10)
  })

  it("excludes unscored responses from the score average", () => {
    expect(
      getAverageActivityScore([
        response("user-1", "completed", 80),
        response("user-2", "completed", null),
        response("user-3", "in_progress", 100),
      ])
    ).toBe(80)
  })

  it("returns no completion rate when there is no audience", () => {
    expect(getActivityCompletionPercent([], 0)).toBeNull()
  })

  it("prefers a final teacher grade over the automatic score", () => {
    const graded = response("user-1", "completed", 60)
    graded.gradingStatus = "graded"
    graded.teacherScorePercent = 90

    expect(getAverageActivityScore([graded])).toBe(90)
  })

  it("intersects explicit users with restricted track access", () => {
    const audienceSize = getActivityAudienceSize({
      activity: {
        visibility: "users",
        userIds: ["user-1", "user-2", "user-3"],
        trackId: "track-1",
      },
      track: { userIds: ["user-1", "user-3", "user-4"] },
      courseStudentCount: 8,
    })

    expect(audienceSize).toBe(2)
  })

})
