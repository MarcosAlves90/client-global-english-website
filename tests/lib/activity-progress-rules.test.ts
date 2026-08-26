import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

describe("activity progress Firestore policy", () => {
  const rules = readFileSync("firestore.rules", "utf8")

  it("blocks normal student writes after activity close and after final submission", () => {
    expect(rules).toContain("canSubmitActivity(request.resource.data.activityId)")
    expect(rules).toContain('resource.data.status != "completed"')
  })

  it("allows only the explicit revision resubmission grading transition", () => {
    expect(rules).toContain('resource.data.gradingStatus == "revision_requested"')
    expect(rules).toContain('request.resource.data.gradingStatus == "pending"')
    expect(rules).toContain('request.resource.data.status == "completed"')
    expect(rules).toContain("request.resource.data.activityId == resource.data.activityId")
    expect(rules).toContain("request.resource.data.courseId == resource.data.courseId")
    expect(rules).toContain("request.resource.data.trackId == resource.data.trackId")
    expect(rules).toContain("submissionMatchesActivity(")
  })

  it("keeps teacher review metadata outside student control", () => {
    for (const field of [
      "teacherScorePercent",
      "teacherFeedback",
      "gradedBy",
      "gradedAt",
    ]) {
      expect(rules).toContain(`'${field}'`)
    }
    expect(rules).toContain("allow delete: if isAdmin();")
  })
})
