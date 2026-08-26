import { describe, expect, it } from "vitest"

import {
  calculateFinalGradeAverage,
  getEffectiveScore,
  getGradebookEntryState,
  validateTeacherGradeDraft,
  validateTeacherRevisionRequest,
} from "@/lib/activities/grading"

describe("teacher grading", () => {
  it("validates score bounds and normalizes feedback", () => {
    expect(validateTeacherGradeDraft({ scorePercent: -1, feedback: "" }).ok).toBe(false)
    expect(validateTeacherGradeDraft({ scorePercent: 101, feedback: "" }).ok).toBe(false)
    expect(
      validateTeacherGradeDraft({ scorePercent: 87.456, feedback: "  Good work.  " })
    ).toEqual({
      ok: true,
      value: { scorePercent: 87.46, feedback: "Good work." },
    })
  })

  it("requires actionable feedback before requesting revision", () => {
    expect(validateTeacherRevisionRequest({ feedback: "   " }).ok).toBe(false)
    expect(validateTeacherRevisionRequest({ feedback: "  Rewrite paragraph two.  " })).toEqual({
      ok: true,
      value: { feedback: "Rewrite paragraph two." },
    })
  })

  it("prefers the teacher grade over an automatic score", () => {
    expect(
      getEffectiveScore({
        gradingStatus: "graded",
        teacherScorePercent: 92,
        scorePercent: 70,
      })
    ).toEqual({ scorePercent: 92, source: "teacher" })
  })

  it("falls back to automatic scoring while grading is pending", () => {
    expect(
      getEffectiveScore({
        gradingStatus: "pending",
        teacherScorePercent: null,
        scorePercent: 70,
      })
    ).toEqual({ scorePercent: 70, source: "automatic" })
  })

  it("only includes final teacher grades in gradebook averages", () => {
    expect(
      calculateFinalGradeAverage([
        { gradingStatus: "graded", teacherScorePercent: 90 },
        { gradingStatus: "pending", teacherScorePercent: null },
        { gradingStatus: "revision_requested", teacherScorePercent: null },
        { gradingStatus: "graded", teacherScorePercent: 80 },
      ])
    ).toBe(85)
  })

  it("distinguishes pending review, revision and graded gradebook states", () => {
    expect(getGradebookEntryState(null)).toBe("not_started")
    expect(
      getGradebookEntryState({ status: "in_progress", gradingStatus: "pending" })
    ).toBe("in_progress")
    expect(
      getGradebookEntryState({ status: "completed", gradingStatus: "pending" })
    ).toBe("pending_review")
    expect(
      getGradebookEntryState({ status: "in_progress", gradingStatus: "revision_requested" })
    ).toBe("revision_requested")
    expect(
      getGradebookEntryState({ status: "completed", gradingStatus: "graded" })
    ).toBe("graded")
  })
})
