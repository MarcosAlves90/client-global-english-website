import { afterEach, describe, expect, it, vi } from "vitest"

import {
  buildCloudinaryUrl,
  cloudinaryUrlsMatch,
  normalizeCloudinaryUrl,
  normalizeCloudinaryUrlWithoutVersion,
  optimizeCloudinaryUrl,
} from "@/lib/cloudinary-url"

afterEach(() => {
  vi.unstubAllEnvs()
})

describe("optimizeCloudinaryUrl", () => {
  it("aplica transformações padrão em URL do Cloudinary", () => {
    const input = "https://res.cloudinary.com/demo/image/upload/v12345/folder/photo.jpg"

    const output = optimizeCloudinaryUrl(input)

    expect(output).toContain("/upload/f_auto,q_auto,dpr_auto,fl_progressive/")
    expect(output).toContain("/v12345/folder/photo.jpg")
  })

  it("não altera URL fora do Cloudinary", () => {
    const input = "https://example.com/image.jpg"

    expect(optimizeCloudinaryUrl(input)).toBe(input)
  })

  it("não duplica otimização quando já existe transformação automática", () => {
    vi.stubEnv("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME", "demo")

    const input = "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,dpr_auto,fl_progressive/v12345/folder/photo.jpg"

    expect(optimizeCloudinaryUrl(input)).toBe(input)
  })

  it("aplica largura, altura e crop quando informado", () => {
    const input = "https://res.cloudinary.com/demo/image/upload/v12345/folder/photo.jpg"

    const output = optimizeCloudinaryUrl(input, {
      width: 320,
      height: 200,
      crop: "fill",
      gravity: "auto",
    })

    expect(output).toContain("w_320")
    expect(output).toContain("h_200")
    expect(output).toContain("c_fill")
    expect(output).toContain("g_auto")
  })

  it("reconstrói URLs usando o cloud name do env", () => {
    vi.stubEnv("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME", "new-cloud")

    const output = buildCloudinaryUrl("v12345/folder/photo.jpg")

    expect(output).toBe(
      "https://res.cloudinary.com/new-cloud/image/upload/v12345/folder/photo.jpg"
    )
  })

  it("normaliza URLs antigas para o cloud name atual", () => {
    vi.stubEnv("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME", "new-cloud")

    const input = "https://res.cloudinary.com/old-cloud/image/upload/v12345/folder/photo.jpg"

    expect(normalizeCloudinaryUrl(input)).toBe(
      "https://res.cloudinary.com/new-cloud/image/upload/v12345/folder/photo.jpg"
    )
  })

  it("remove a versão do Cloudinary quando solicitado", () => {
    vi.stubEnv("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME", "new-cloud")

    const input = "https://res.cloudinary.com/old-cloud/image/upload/v12345/folder/photo.jpg"

    expect(normalizeCloudinaryUrlWithoutVersion(input)).toBe(
      "https://res.cloudinary.com/new-cloud/image/upload/folder/photo.jpg"
    )
  })

  it("considera URLs antigas e novas equivalentes pelo public id", () => {
    expect(
      cloudinaryUrlsMatch(
        "https://res.cloudinary.com/old-cloud/raw/upload/v1/global-english/file.pdf",
        "https://res.cloudinary.com/new-cloud/raw/upload/v1/global-english/file.pdf"
      )
    ).toBe(true)
  })
})
