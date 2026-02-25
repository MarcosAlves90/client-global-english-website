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

    mockFetchOnce([{ id: "a1" }])
    const first = await fetchAdminCourseActivities("token", "course-1")
    const cached = await fetchAdminCourseActivities("token", "course-1")

    expect(first).toEqual([{ id: "a1" }])
    expect(cached).toEqual([{ id: "a1" }])
    expect(fetch).toHaveBeenCalledTimes(1)

    mockFetchOnce({ id: "a2" })
    await createAdminActivity("token", {
      courseId: "course-1",
      trackId: "track-1",
      title: "Activity",
      type: "lesson",
      estimatedMinutes: 10,
      visibility: "module",
    })

    mockFetchOnce([{ id: "a3" }])
    const refreshed = await fetchAdminCourseActivities("token", "course-1")
    expect(refreshed).toEqual([{ id: "a3" }])
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
})
