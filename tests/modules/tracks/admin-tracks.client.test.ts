import { afterEach, describe, expect, it, vi } from "vitest"

afterEach(() => {
  vi.restoreAllMocks()
  vi.resetModules()
})

function mockFetchOnce(payload: unknown, ok = true, status = 200) {
  vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
    ok,
    status,
    json: async () => payload,
  } as Response)
}

describe("admin tracks client", () => {
  it("caches per course and clears after create", async () => {
    const { fetchAdminCourseTracks, createAdminCourseTrack } = await import(
      "@/modules/tracks/api/admin-tracks.client"
    )

    mockFetchOnce([{ id: "t1" }])
    await fetchAdminCourseTracks("token", "course-1")
    await fetchAdminCourseTracks("token", "course-1")
    expect(fetch).toHaveBeenCalledTimes(1)

    mockFetchOnce({ id: "t2" })
    await createAdminCourseTrack("token", {
      courseId: "course-1",
      title: "Track",
      description: "Desc",
    })

    mockFetchOnce([{ id: "t3" }])
    await fetchAdminCourseTracks("token", "course-1")
    expect(fetch).toHaveBeenCalledTimes(3)
  })

  it("maps 409 to USER_CONFLICT", async () => {
    const { createAdminCourseTrack } = await import(
      "@/modules/tracks/api/admin-tracks.client"
    )

    mockFetchOnce({ message: "conflict" }, false, 409)

    await expect(
      createAdminCourseTrack("token", {
        courseId: "course-1",
        title: "Track",
        description: "Desc",
      })
    ).rejects.toThrow("USER_CONFLICT")
  })
})
