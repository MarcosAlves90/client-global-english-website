import { beforeEach, describe, expect, it, vi } from "vitest"

const { configMock, destroyMock } = vi.hoisted(() => ({
  configMock: vi.fn(),
  destroyMock: vi.fn(),
}))

vi.mock("cloudinary", () => ({
  v2: {
    config: configMock,
    uploader: {
      destroy: destroyMock,
    },
  },
}))

describe("Cloudinary asset deletion", () => {
  beforeEach(() => {
    configMock.mockReset()
    destroyMock.mockReset()
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = "demo"
    process.env.CLOUDINARY_API_KEY = "key"
    process.env.CLOUDINARY_API_SECRET = "secret"
  })

  it("continues past an image miss so audio/video assets are actually removed", async () => {
    destroyMock
      .mockResolvedValueOnce({ result: "not found" })
      .mockResolvedValueOnce({ result: "ok" })

    const { deleteCloudinaryAssetsByUrls } = await import("@/lib/cloudinary-admin")

    await deleteCloudinaryAssetsByUrls([
      "https://res.cloudinary.com/demo/video/upload/v1/global-english/audio/pronuncia.mp3",
    ])

    expect(destroyMock).toHaveBeenNthCalledWith(
      1,
      "global-english/audio/pronuncia",
      expect.objectContaining({ resource_type: "image" })
    )
    expect(destroyMock).toHaveBeenNthCalledWith(
      2,
      "global-english/audio/pronuncia",
      expect.objectContaining({ resource_type: "video" })
    )
  })
})
