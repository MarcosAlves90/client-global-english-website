import { afterEach, describe, expect, it, vi } from "vitest"

afterEach(() => {
  vi.restoreAllMocks()
  vi.resetModules()
})

function mockFetchOnce(payload: unknown, ok = true) {
  vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
    ok,
    json: async () => payload,
  } as Response)
}

describe("admin activities client", () => {
  it("caches per course and clears after create", async () => {
    const { fetchAdminCourseActivities, createAdminActivity } = await import(
      "@/modules/activities/api/admin-activities.client"
    )

    mockFetchOnce([
      {
        id: "a1",
        courseId: "course-1",
        trackId: "track-1",
        title: "Activity 1",
        type: "lesson",
        order: 1,
        estimatedMinutes: 10,
        visibility: "module",
        userIds: [],
        releaseAt: null,
        attachments: [],
        questions: [],
      },
    ])
    const first = await fetchAdminCourseActivities("token", "course-1")
    const cached = await fetchAdminCourseActivities("token", "course-1")

    expect(first).toEqual([
      {
        id: "a1",
        courseId: "course-1",
        trackId: "track-1",
        title: "Activity 1",
        type: "lesson",
        order: 1,
        estimatedMinutes: 10,
        visibility: "module",
        userIds: [],
        releaseAt: null,
        attachments: [],
        questions: [],
      },
    ])
    expect(cached).toEqual([
      {
        id: "a1",
        courseId: "course-1",
        trackId: "track-1",
        title: "Activity 1",
        type: "lesson",
        order: 1,
        estimatedMinutes: 10,
        visibility: "module",
        userIds: [],
        releaseAt: null,
        attachments: [],
        questions: [],
      },
    ])
    expect(fetch).toHaveBeenCalledTimes(1)

    mockFetchOnce({
      id: "a2",
      courseId: "course-1",
      trackId: "track-1",
      title: "Activity 2",
      type: "lesson",
      order: 2,
      estimatedMinutes: 10,
      visibility: "module",
      userIds: [],
      releaseAt: null,
      attachments: [],
      questions: [],
    })
    await createAdminActivity("token", {
      courseId: "course-1",
      trackId: "track-1",
      title: "Activity",
      type: "lesson",
      estimatedMinutes: 10,
      visibility: "module",
    })

    mockFetchOnce([
      {
        id: "a3",
        courseId: "course-1",
        trackId: "track-1",
        title: "Activity 3",
        type: "lesson",
        order: 3,
        estimatedMinutes: 10,
        visibility: "module",
        userIds: [],
        releaseAt: null,
        attachments: [],
        questions: [],
      },
    ])
    const refreshed = await fetchAdminCourseActivities("token", "course-1")
    expect(refreshed).toEqual([
      {
        id: "a3",
        courseId: "course-1",
        trackId: "track-1",
        title: "Activity 3",
        type: "lesson",
        order: 3,
        estimatedMinutes: 10,
        visibility: "module",
        userIds: [],
        releaseAt: null,
        attachments: [],
        questions: [],
      },
    ])
    expect(fetch).toHaveBeenCalledTimes(3)
  })

  it("throws when create fails", async () => {
    const { createAdminActivity } = await import(
      "@/modules/activities/api/admin-activities.client"
    )

    mockFetchOnce({ message: "fail" }, false)

    await expect(
      createAdminActivity("token", {
        courseId: "course-1",
        trackId: "track-1",
        title: "Activity",
        type: "lesson",
        estimatedMinutes: 10,
        visibility: "module",
      })
    ).rejects.toThrow("create failed")
  })

  it("uses DELETE for removal", async () => {
    const { deleteAdminActivity } = await import(
      "@/modules/activities/api/admin-activities.client"
    )

    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce({ ok: true } as Response)

    await deleteAdminActivity("token", "activity-1")

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/admin/activities",
      expect.objectContaining({ method: "DELETE" })
    )
  })
  it("uses PATCH to append attachments to an existing activity", async () => {
    const { updateAdminActivity } = await import(
      "@/modules/activities/api/admin-activities.client"
    )

    const response = {
      id: "activity-1",
      courseId: "course-1",
      trackId: "track-1",
      title: "Activity",
      type: "assignment",
      order: 1,
      estimatedMinutes: 10,
      attachments: [
        { name: "pronuncia.mp3", url: "https://res.cloudinary.com/demo/video/upload/pronuncia.mp3", type: "audio" },
      ],
      questions: [],
    }
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => response,
    } as Response)

    await updateAdminActivity("token", {
      id: "activity-1",
      attachments: response.attachments as Array<{ name: string; url: string; type: "audio" }>,
    })

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/admin/activities",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ id: "activity-1", attachments: response.attachments }),
      })
    )
  })

})
