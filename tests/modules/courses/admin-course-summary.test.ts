import { describe, expect, it } from "vitest"

import {
  buildAdminCourseCatalog,
  buildAdminCourseSummaries,
} from "@/modules/courses/server/admin-course-summary"

function snapshot(id: string, data: Record<string, unknown>) {
  return { id, data: () => data }
}

describe("buildAdminCourseSummaries", () => {
  it("aggregates modules, activities and unique students without per-course queries", () => {
    const result = buildAdminCourseSummaries({
      courses: [
        snapshot("course-b", {
          title: "Zulu",
          description: "Second",
          level: "Advanced",
          durationWeeks: 8,
          status: "Em andamento",
        }),
        snapshot("course-a", {
          title: "Alpha",
          description: "First",
          level: "Beginner",
          durationWeeks: 4,
        }),
      ],
      tracks: [
        snapshot("track-1", { courseId: "course-a", userIds: ["user-1", "user-2"] }),
        snapshot("track-2", { courseId: "course-a", userIds: ["user-1"] }),
        snapshot("track-3", { courseId: "course-b", userIds: [] }),
      ],
      enrollments: [
        snapshot("enrollment-1", { courseId: "course-a", userId: "user-2" }),
        snapshot("enrollment-2", { courseId: "course-a", userId: "user-3" }),
        snapshot("enrollment-3", { courseId: "course-b", userId: "user-4" }),
      ],
      activities: [
        snapshot("activity-1", { courseId: "course-a" }),
        snapshot("activity-2", { courseId: "course-a" }),
        snapshot("activity-3", { courseId: "course-b" }),
      ],
    })

    expect(result).toEqual([
      expect.objectContaining({
        id: "course-a",
        title: "Alpha",
        modulesCount: 2,
        studentsCount: 3,
        activitiesCount: 2,
      }),
      expect.objectContaining({
        id: "course-b",
        title: "Zulu",
        modulesCount: 1,
        studentsCount: 1,
        activitiesCount: 1,
      }),
    ])
  })

  it("ignores orphan relation documents", () => {
    const [course] = buildAdminCourseSummaries({
      courses: [snapshot("course-a", { title: "Course" })],
      tracks: [snapshot("track-orphan", { courseId: "missing", userIds: ["user-1"] })],
      enrollments: [snapshot("enrollment-orphan", { courseId: "missing", userId: "user-2" })],
      activities: [snapshot("activity-orphan", { courseId: "missing" })],
    })

    expect(course).toEqual(
      expect.objectContaining({
        modulesCount: 0,
        studentsCount: 0,
        activitiesCount: 0,
      })
    )
  })
  it("reports catalog totals with unique students across courses", () => {
    const catalog = buildAdminCourseCatalog({
      courses: [
        snapshot("course-a", { title: "Alpha" }),
        snapshot("course-b", { title: "Beta" }),
      ],
      tracks: [
        snapshot("track-a", { courseId: "course-a", userIds: ["user-1", "user-2"] }),
        snapshot("track-b", { courseId: "course-b", userIds: ["user-1"] }),
      ],
      enrollments: [
        snapshot("enrollment-a", { courseId: "course-a", userId: "user-3" }),
        snapshot("enrollment-b", { courseId: "course-b", userId: "user-2" }),
      ],
      activities: [
        snapshot("activity-a", { courseId: "course-a" }),
        snapshot("activity-b", { courseId: "course-b" }),
      ],
    })

    expect(catalog.metrics).toEqual({
      coursesCount: 2,
      uniqueStudentsCount: 3,
      modulesCount: 2,
      activitiesCount: 2,
    })
  })

  it("normalizes assigned teacher ids", () => {
    const [course] = buildAdminCourseSummaries({
      courses: [snapshot("course-a", { title: "Alpha", teacherIds: [" teacher-1 ", "teacher-1", "teacher-2"] })],
      tracks: [],
      enrollments: [],
      activities: [],
    })

    expect(course.teacherIds).toEqual(["teacher-1", "teacher-2"])
  })

})
