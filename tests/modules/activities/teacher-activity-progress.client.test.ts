import { afterEach, describe, expect, it, vi } from "vitest"

const responseItem = {
  id: "progress-1",
  userId: "student-1",
  activityId: "activity-1",
  courseId: "course-1",
  trackId: "track-1",
  status: "completed" as const,
  answers: { q1: "Answer" },
  answeredCount: 1,
  totalQuestions: 1,
  completionPercent: 100,
  scorePercent: null,
  gradingStatus: "pending" as const,
  teacherScorePercent: null,
  teacherFeedback: null,
  gradedBy: null,
  gradedAt: null,
  submittedAt: "2026-08-22T10:00:00.000Z",
  createdAt: "2026-08-22T09:00:00.000Z",
  updatedAt: "2026-08-22T10:00:00.000Z",
  user: {
    uid: "student-1",
    name: "Student",
    email: "student@example.com",
  },
  activity: {
    id: "activity-1",
    title: "Writing",
    type: "assignment" as const,
    questions: [
      {
        id: "q1",
        type: "essay" as const,
        prompt: "Write a paragraph",
      },
    ],
  },
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.resetModules()
})

describe("teacher activity progress client", () => {
  it("caches submissions by course and activity", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [responseItem],
    } as Response)

    const { fetchTeacherActivityProgress } = await import(
      "@/modules/activities/api/teacher-activity-progress.client"
    )

    const first = await fetchTeacherActivityProgress({
      idToken: "token",
      courseId: "course-1",
      activityId: "activity-1",
    })
    const cached = await fetchTeacherActivityProgress({
      idToken: "token",
      courseId: "course-1",
      activityId: "activity-1",
    })

    expect(first).toHaveLength(1)
    expect(cached).toEqual(first)
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it("sends grades through PATCH and invalidates cached submissions", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [responseItem],
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ ok: true }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [responseItem],
      } as Response)

    const {
      fetchTeacherActivityProgress,
      gradeTeacherActivityProgress,
    } = await import("@/modules/activities/api/teacher-activity-progress.client")

    await fetchTeacherActivityProgress({ idToken: "token", courseId: "course-1" })
    await gradeTeacherActivityProgress({
      idToken: "token",
      id: "progress-1",
      scorePercent: 90,
      feedback: "Good work",
    })
    await fetchTeacherActivityProgress({ idToken: "token", courseId: "course-1" })

    expect(fetchSpy).toHaveBeenNthCalledWith(
      2,
      "/api/teacher/activity-progress",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({
          id: "progress-1",
          action: "grade",
          scorePercent: 90,
          feedback: "Good work",
        }),
      })
    )
    expect(fetchSpy).toHaveBeenCalledTimes(3)
  })

  it("requests revision through the same review endpoint", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    } as Response)

    const { requestTeacherActivityRevision } = await import(
      "@/modules/activities/api/teacher-activity-progress.client"
    )

    await requestTeacherActivityRevision({
      idToken: "token",
      id: "progress-1",
      feedback: "Please revise paragraph two.",
    })

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/teacher/activity-progress",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({
          id: "progress-1",
          action: "request_revision",
          feedback: "Please revise paragraph two.",
        }),
      })
    )
  })

})
