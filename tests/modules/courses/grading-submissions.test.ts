import { describe, expect, it } from "vitest"

import type { AdminActivityResponse } from "@/lib/firebase/types"
import {
  filterTeacherSubmissions,
  paginateTeacherSubmissions,
} from "@/modules/courses/model/grading-submissions"

function submission(overrides: Partial<AdminActivityResponse> & { id: string }): AdminActivityResponse {
  return {
    id: overrides.id,
    userId: overrides.userId ?? `user-${overrides.id}`,
    activityId: overrides.activityId ?? "activity-1",
    courseId: overrides.courseId ?? "course-1",
    trackId: overrides.trackId ?? "track-1",
    status: overrides.status ?? "completed",
    answers: overrides.answers ?? {},
    answeredCount: overrides.answeredCount ?? 1,
    totalQuestions: overrides.totalQuestions ?? 1,
    completionPercent: overrides.completionPercent ?? 100,
    scorePercent: overrides.scorePercent ?? null,
    gradingStatus: overrides.gradingStatus ?? "pending",
    teacherScorePercent: overrides.teacherScorePercent ?? null,
    teacherFeedback: overrides.teacherFeedback ?? null,
    gradedBy: overrides.gradedBy ?? null,
    gradedAt: overrides.gradedAt ?? null,
    submittedAt: overrides.submittedAt ?? null,
    createdAt: overrides.createdAt ?? null,
    updatedAt: overrides.updatedAt ?? null,
    user: overrides.user,
    activity: overrides.activity,
  }
}

describe("teacher grading submission filters", () => {
  const items = [
    submission({
      id: "new-pending",
      submittedAt: "2026-08-24T12:00:00Z",
      user: { uid: "u1", name: "Bruno", email: "bruno@example.com" },
      activity: { id: "a1", title: "Speaking", type: "assignment", questions: [] },
    }),
    submission({
      id: "old-pending",
      submittedAt: "2026-07-01T12:00:00Z",
      user: { uid: "u2", name: "Ana", email: "ana@example.com" },
      activityId: "a2",
      activity: { id: "a2", title: "Writing", type: "assignment", questions: [] },
    }),
    submission({
      id: "graded",
      gradingStatus: "graded",
      submittedAt: "2026-08-23T12:00:00Z",
      user: { uid: "u3", name: "Carla", email: "carla@example.com" },
      activity: { id: "a1", title: "Speaking", type: "assignment", questions: [] },
    }),
  ]

  it("combines status, activity, search and date filters", () => {
    const result = filterTeacherSubmissions(
      items,
      {
        status: "pending",
        searchQuery: "bruno",
        activityId: "a1",
        dateRange: "7d",
        sort: "newest",
      },
      new Date("2026-08-25T00:00:00Z")
    )

    expect(result.map((item) => item.id)).toEqual(["new-pending"])
  })

  it("sorts filtered submissions without mutating source order", () => {
    const sourceIds = items.map((item) => item.id)
    const result = filterTeacherSubmissions(items, {
      status: "pending",
      searchQuery: "",
      activityId: "all",
      dateRange: "all",
      sort: "student",
    })

    expect(result.map((item) => item.id)).toEqual(["old-pending", "new-pending"])
    expect(items.map((item) => item.id)).toEqual(sourceIds)
  })
})

describe("teacher grading submission pagination", () => {
  it("returns stable ranges and clamps pages", () => {
    const items = Array.from({ length: 23 }, (_, index) => index + 1)

    expect(paginateTeacherSubmissions(items, 2, 10)).toMatchObject({
      items: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
      page: 2,
      totalPages: 3,
      totalItems: 23,
      from: 11,
      to: 20,
    })

    expect(paginateTeacherSubmissions(items, 99, 10)).toMatchObject({
      items: [21, 22, 23],
      page: 3,
      from: 21,
      to: 23,
    })
  })
})
