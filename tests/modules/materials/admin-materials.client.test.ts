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

describe("admin materials client", () => {
  it("caches per course and clears after create", async () => {
    const { fetchAdminCourseMaterials, createAdminMaterial } = await import(
      "@/modules/materials/api/admin-materials.client"
    )

    mockFetchOnce([{ id: "m1" }])
    const first = await fetchAdminCourseMaterials("token", "course-1")
    const cached = await fetchAdminCourseMaterials("token", "course-1")

    expect(first).toEqual([{ id: "m1" }])
    expect(cached).toEqual([{ id: "m1" }])
    expect(fetch).toHaveBeenCalledTimes(1)

    mockFetchOnce({ id: "m2" })
    await createAdminMaterial("token", {
      courseId: "course-1",
      trackId: "track-1",
      title: "Material",
      visibility: "module",
    })

    mockFetchOnce([{ id: "m3" }])
    const refreshed = await fetchAdminCourseMaterials("token", "course-1")
    expect(refreshed).toEqual([{ id: "m3" }])
    expect(fetch).toHaveBeenCalledTimes(3)
  })

  it("throws when load fails", async () => {
    const { fetchAdminCourseMaterials } = await import(
      "@/modules/materials/api/admin-materials.client"
    )

    mockFetchOnce({ message: "fail" }, false)

    await expect(
      fetchAdminCourseMaterials("token", "course-1")
    ).rejects.toThrow("failed to load materials")
  })

  it("uses DELETE for removal", async () => {
    const { deleteAdminMaterial } = await import(
      "@/modules/materials/api/admin-materials.client"
    )

    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce({ ok: true } as Response)

    await deleteAdminMaterial("token", "material-1")

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/admin/materials",
      expect.objectContaining({ method: "DELETE" })
    )
  })
})
