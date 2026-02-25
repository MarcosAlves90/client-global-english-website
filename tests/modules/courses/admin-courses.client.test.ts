import { describe, expect, it, vi, afterEach } from "vitest"

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

describe("admin courses client", () => {
  it("caches results and skips fetch within TTL", async () => {
    const { fetchAdminCourses } = await import(
      "@/modules/courses/api/admin-courses.client"
    )

    const data = [{ id: "1", title: "Course" }]
    mockFetchOnce(data)

    const first = await fetchAdminCourses("token")
    const second = await fetchAdminCourses("token")

    expect(first).toEqual(data)
    expect(second).toEqual(data)
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it("forces reload when requested", async () => {
    const { fetchAdminCourses } = await import(
      "@/modules/courses/api/admin-courses.client"
    )

    mockFetchOnce([{ id: "1" }])
    mockFetchOnce([{ id: "2" }])

    await fetchAdminCourses(null)
    const next = await fetchAdminCourses(null, { force: true })

    expect(next).toEqual([{ id: "2" }])
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it("throws when load fails", async () => {
    const { fetchAdminCourses } = await import(
      "@/modules/courses/api/admin-courses.client"
    )

    mockFetchOnce({ message: "fail" }, false)

    await expect(fetchAdminCourses(null)).rejects.toThrow("failed to load")
  })

  it("uses POST for create and PATCH for update", async () => {
    const { saveAdminCourse } = await import(
      "@/modules/courses/api/admin-courses.client"
    )

    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue({ ok: true } as Response)

    await saveAdminCourse("token", {
      title: "Course",
      description: "Desc",
      level: "Beginner",
      durationWeeks: 4,
      coverUrl: null,
      status: "draft",
    })

    await saveAdminCourse("token", {
      id: "1",
      title: "Course",
      description: "Desc",
      level: "Beginner",
      durationWeeks: 4,
      coverUrl: null,
      status: "draft",
    })

    expect(fetchSpy).toHaveBeenNthCalledWith(
      1,
      "/api/admin/courses",
      expect.objectContaining({ method: "POST" })
    )
    expect(fetchSpy).toHaveBeenNthCalledWith(
      2,
      "/api/admin/courses",
      expect.objectContaining({ method: "PATCH" })
    )
  })
})
