import { describe, expect, it } from "vitest"

import {
  buildGradebookProgressMap,
  collectGradebookStudentIds,
  summarizeTeacherGradebook,
} from "@/modules/courses/model/gradebook"
import type { TeacherGradebookProgress } from "@/lib/firebase/types"

function progress(
  id: string,
  userId: string,
  activityId: string,
  gradingStatus: TeacherGradebookProgress["gradingStatus"],
  status: TeacherGradebookProgress["status"] = "completed",
  teacherScorePercent: number | null = null
): TeacherGradebookProgress {
  return {
    id,
    userId,
    activityId,
    status,
    gradingStatus,
    automaticScorePercent: 70,
    teacherScorePercent,
    teacherFeedback: null,
    submittedAt: null,
    reviewedAt: null,
  }
}

describe("teacher gradebook model", () => {

  it("keeps every linked or historical course student without duplicates", () => {
    expect(
      collectGradebookStudentIds(
        ["student-1", "student-2"],
        ["student-2", "student-3"],
        ["student-4", "", " student-1 "]
      )
    ).toEqual(["student-1", "student-2", "student-3", "student-4"])
  })
  it("indexes one progress entry per student and activity", () => {
    const map = buildGradebookProgressMap([
      progress("p1", "u1", "a1", "graded", "completed", 90),
      progress("p2", "u2", "a1", "pending"),
    ])

    expect(map.get("u1:a1")?.teacherScorePercent).toBe(90)
    expect(map.get("u2:a1")?.gradingStatus).toBe("pending")
  })

  it("summarizes only submitted review work and explicit revision requests", () => {
    expect(
      summarizeTeacherGradebook([
        progress("p1", "u1", "a1", "graded", "completed", 90),
        progress("p2", "u2", "a1", "pending"),
        progress("p3", "u3", "a1", "revision_requested", "in_progress"),
        progress("p4", "u4", "a1", "pending", "in_progress"),
      ])
    ).toEqual({
      awaitingReviewCount: 1,
      revisionRequestedCount: 1,
      gradedCount: 1,
    })
  })
})
