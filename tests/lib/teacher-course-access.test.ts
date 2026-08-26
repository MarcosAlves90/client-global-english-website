import { describe, expect, it } from "vitest"

import { areUsersEnrolledInCourse, isTeacherAssignedToCourse } from "@/lib/auth/course-access"

describe("teacher course access", () => {
  it("only accepts teachers explicitly assigned to a course", () => {
    expect(
      isTeacherAssignedToCourse(["teacher-1", " teacher-2 "], "teacher-2")
    ).toBe(true)
    expect(isTeacherAssignedToCourse(["teacher-1"], "teacher-2")).toBe(false)
  })

  it("rejects malformed assignment values", () => {
    expect(isTeacherAssignedToCourse(null, "teacher-1")).toBe(false)
    expect(isTeacherAssignedToCourse([null, 42, ""], "teacher-1")).toBe(false)
  })

  it("only allows targeted students enrolled in the course", () => {
    expect(
      areUsersEnrolledInCourse(["student-1", "student-2"], ["student-1", "student-2", "student-3"])
    ).toBe(true)
    expect(
      areUsersEnrolledInCourse(["student-1", "outside-course"], ["student-1", "student-2"])
    ).toBe(false)
    expect(areUsersEnrolledInCourse([], [])).toBe(true)
  })
})
