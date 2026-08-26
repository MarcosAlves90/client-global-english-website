import { afterEach, describe, expect, it, vi } from "vitest"

const gradebook = {
  course: { id: "course-1", title: "Business English" },
  activities: [
    {
      id: "activity-1",
      title: "Writing",
      type: "assignment" as const,
      trackId: "track-1",
      trackTitle: "Module 1",
      order: 1,
      dueAt: null,
    },
  ],
  students: [
    { uid: "student-1", name: "Student", email: "student@example.com" },
  ],
  progress: [
    {
      id: "progress-1",
      userId: "student-1",
      activityId: "activity-1",
      status: "completed" as const,
      gradingStatus: "graded" as const,
      automaticScorePercent: null,
      teacherScorePercent: 92,
      teacherFeedback: "Good work",
      submittedAt: null,
      reviewedAt: null,
    },
  ],
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.resetModules()
})

describe("teacher gradebook client", () => {
  it("loads and caches an authorized course gradebook", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => gradebook,
    } as Response)

    const { fetchTeacherGradebook } = await import(
      "@/modules/courses/api/teacher-gradebook.client"
    )

    const first = await fetchTeacherGradebook({
      idToken: "token",
      courseId: "course-1",
    })
    const cached = await fetchTeacherGradebook({
      idToken: "token",
      courseId: "course-1",
    })

    expect(first.course.title).toBe("Business English")
    expect(cached).toEqual(first)
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })
})
