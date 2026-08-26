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

    mockFetchOnce([
      {
        id: "m1",
        title: "Material 1",
      },
    ])
    const first = await fetchAdminCourseMaterials("token", "course-1")
    const cached = await fetchAdminCourseMaterials("token", "course-1")

    expect(first).toEqual([{ id: "m1", title: "Material 1" }])
    expect(cached).toEqual([{ id: "m1", title: "Material 1" }])
    expect(fetch).toHaveBeenCalledTimes(1)

    mockFetchOnce({
      id: "m2",
      title: "Material 2",
    })
    await createAdminMaterial("token", {
      courseId: "course-1",
      trackId: "track-1",
      title: "Material",
      visibility: "module",
    })

    mockFetchOnce([
      {
        id: "m3",
        title: "Material 3",
      },
    ])
    const refreshed = await fetchAdminCourseMaterials("token", "course-1")
    expect(refreshed).toEqual([{ id: "m3", title: "Material 3" }])
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

  it("sends attachments when updating an existing material", async () => {
    const { updateAdminMaterial } = await import(
      "@/modules/materials/api/admin-materials.client"
    )

    const attachments = [
      {
        name: "guide.pdf",
        url: "https://res.cloudinary.com/demo/image/upload/v1/guide.pdf",
        type: "pdf" as const,
      },
    ]
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: "material-1",
        title: "Material",
        attachments,
      }),
    } as Response)

    await updateAdminMaterial("token", {
      id: "material-1",
      attachments,
    })

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/admin/materials",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ id: "material-1", attachments }),
      })
    )
  })
})
