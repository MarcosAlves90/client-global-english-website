import { afterEach, describe, expect, it, vi } from "vitest"

afterEach(() => {
  vi.restoreAllMocks()
  vi.resetModules()
})

describe("admin attachments client", () => {
  it("uses DELETE and payload for material attachment", async () => {
    const { deleteAdminAttachment } = await import(
      "@/modules/attachments/api/admin-attachments.client"
    )

    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce({ ok: true } as Response)

    await deleteAdminAttachment("token", {
      entityType: "material",
      entityId: "material-1",
      attachmentUrl: "https://res.cloudinary.com/demo/raw/upload/v1/file.pdf",
    })

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/admin/attachments",
      expect.objectContaining({
        method: "DELETE",
        body: JSON.stringify({
          entityType: "material",
          entityId: "material-1",
          attachmentUrl: "https://res.cloudinary.com/demo/raw/upload/v1/file.pdf",
        }),
      })
    )
  })

  it("throws when request fails", async () => {
    const { deleteAdminAttachment } = await import(
      "@/modules/attachments/api/admin-attachments.client"
    )

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({ ok: false } as Response)

    await expect(
      deleteAdminAttachment("token", {
        entityType: "activity",
        entityId: "activity-1",
        attachmentUrl: "https://res.cloudinary.com/demo/raw/upload/v1/file.mp3",
      })
    ).rejects.toThrow("delete attachment failed")
  })
})
