import { afterEach, describe, expect, it, vi } from "vitest"

const workspace = {
  course: {
    id: "course-1",
    title: "Business English",
    description: "Course description",
    level: "Intermediate" as const,
    durationWeeks: 8,
    coverUrl: null,
    status: "Inscrições abertas",
    modulesCount: 1,
    studentsCount: 1,
    activitiesCount: 1,
    teacherIds: ["teacher-1"],
  },
  tracks: [
    {
      id: "track-1",
      courseId: "course-1",
      title: "Module 1",
      description: "Basics",
      order: 1,
      userIds: ["student-1"],
    },
  ],
  students: [
    {
      uid: "student-1",
      name: "Student",
      email: "student@example.com",
      role: "user" as const,
      team: null,
      disabled: false,
      isRobot: false,
      photoURL: null,
      createdAt: null,
      updatedAt: null,
    },
  ],
  activities: [
    {
      id: "activity-1",
      courseId: "course-1",
      trackId: "track-1",
      title: "Speaking",
      type: "assignment" as const,
      order: 1,
      estimatedMinutes: 15,
      visibility: "module" as const,
      userIds: [],
      releaseAt: null,
      dueAt: null,
      closeAt: null,
      attachments: [],
      questions: [],
    },
  ],
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.resetModules()
})

describe("teacher courses client", () => {
  it("loads the activity-creation workspace for an assigned course", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => workspace,
    } as Response)

    const { fetchTeacherCourseWorkspace } = await import(
      "@/modules/courses/api/teacher-courses.client"
    )

    const result = await fetchTeacherCourseWorkspace("token", "course-1")

    expect(result.course.id).toBe("course-1")
    expect(result.tracks).toHaveLength(1)
    expect(result.students).toHaveLength(1)
    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/teacher/courses/course-1",
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer token" }),
      })
    )
  })
})
