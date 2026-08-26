import { afterEach, describe, expect, it, vi } from "vitest"

import type { AdminCourseCatalog, AdminCourseSummary } from "@/lib/firebase/types"

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

function catalog(items: AdminCourseSummary[]): AdminCourseCatalog {
  return {
    items,
    metrics: {
      coursesCount: items.length,
      uniqueStudentsCount: 0,
      modulesCount: items.reduce((sum, item) => sum + item.modulesCount, 0),
      activitiesCount: items.reduce(
        (sum, item) => sum + item.activitiesCount,
        0
      ),
    },
  }
}

function course(id: string, title: string): AdminCourseSummary {
  return {
    id,
    title,
    description: `Desc ${id}`,
    level: "Beginner",
    durationWeeks: 4,
    coverUrl: null,
    status: "draft",
    modulesCount: 0,
    studentsCount: 0,
    activitiesCount: 0,
  }
}

describe("admin courses client", () => {
  it("caches the catalog and exposes course items", async () => {
    const { fetchAdminCourseCatalog, fetchAdminCourses } = await import(
      "@/modules/courses/api/admin-courses.client"
    )

    const payload = catalog([course("1", "Course")])
    mockFetchOnce(payload)

    const first = await fetchAdminCourses("token")
    const cachedCatalog = await fetchAdminCourseCatalog("token")

    expect(first).toEqual(payload.items)
    expect(cachedCatalog).toEqual(payload)
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(fetch).toHaveBeenCalledWith(
      "/api/admin/courses?includeMetrics=true",
      expect.any(Object)
    )
  })

  it("forces reload when requested", async () => {
    const { fetchAdminCourses } = await import(
      "@/modules/courses/api/admin-courses.client"
    )

    mockFetchOnce(catalog([course("1", "Course 1")]))
    mockFetchOnce(catalog([course("2", "Course 2")]))

    await fetchAdminCourses(null)
    const next = await fetchAdminCourses(null, { force: true })

    expect(next).toEqual([course("2", "Course 2")])
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

  it("uses DELETE for removal", async () => {
    const { deleteAdminCourse } = await import(
      "@/modules/courses/api/admin-courses.client"
    )

    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce({ ok: true } as Response)

    await deleteAdminCourse("token", "course-1")

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/admin/courses",
      expect.objectContaining({ method: "DELETE" })
    )
  })
})
