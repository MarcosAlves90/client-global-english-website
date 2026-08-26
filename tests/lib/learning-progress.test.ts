import { describe, expect, it } from "vitest"

import {
  calculateActivityProgressPercent,
  calculateDashboardProgressPercent,
} from "@/lib/metrics/learning-progress"
import type { ActivityProgress, DashboardCourse } from "@/lib/firebase/types"

function progress(
  activityId: string,
  status: ActivityProgress["status"],
  completionPercent: number
): ActivityProgress {
  return {
    id: `user-1_${activityId}`,
    userId: "user-1",
    activityId,
    courseId: "course-1",
    trackId: "track-1",
    status,
    answers: {},
    answeredCount: 0,
    totalQuestions: 0,
    completionPercent,
    scorePercent: null,
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

describe("learning progress metrics", () => {
  it("uses current activity progress instead of enrollment progress", () => {
    expect(
      calculateActivityProgressPercent(
        ["activity-1", "activity-2", "activity-3"],
        [
          progress("activity-1", "completed", 30),
          progress("activity-2", "in_progress", 50),
        ]
      )
    ).toBe(50)
  })

  it("ignores stale progress for activities that are no longer visible", () => {
    expect(
      calculateActivityProgressPercent(
        ["activity-visible"],
        [
          progress("activity-visible", "in_progress", 25),
          progress("activity-hidden", "completed", 100),
        ]
      )
    ).toBe(25)
  })

  it("calculates dashboard progress across visible activities in all courses", () => {
    const courses = [
      {
        id: "course-1",
        title: "Course",
        description: "",
        level: "Beginner",
        durationWeeks: 4,
        enrollment: {
          id: "enrollment-1",
          userId: "user-1",
          courseId: "course-1",
          status: "active",
          progress: 0,
        },
        tracks: [],
        activities: [
          {
            id: "activity-1",
            courseId: "course-1",
            trackId: "track-1",
            title: "A",
            type: "lesson",
            order: 1,
            estimatedMinutes: 10,
          },
          {
            id: "activity-2",
            courseId: "course-1",
            trackId: "track-1",
            title: "B",
            type: "quiz",
            order: 2,
            estimatedMinutes: 10,
          },
        ],
      },
    ] satisfies DashboardCourse[]

    expect(
      calculateDashboardProgressPercent(courses, [
        progress("activity-1", "completed", 0),
        progress("activity-2", "in_progress", 40),
      ])
    ).toBe(70)
  })
})
