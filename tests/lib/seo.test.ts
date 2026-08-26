import { describe, expect, it } from "vitest"

import {
  buildPageMetadata,
  createHomeStructuredData,
  createOgImageUrl,
  getMetadataBase,
  serializeJsonLd,
  siteConfig,
} from "@/lib/seo"

describe("SEO metadata", () => {
  it("describes the current learning platform without stale or broken text", () => {
    expect(siteConfig.title).toContain("Plataforma de ensino de inglês")
    expect(siteConfig.description).toContain("agenda")
    expect(siteConfig.description).toContain("notas")
    expect(siteConfig.description).toContain("feedback do professor")
    expect(siteConfig.keywords).toContain("plataforma de ensino de inglês")
    expect(siteConfig.keywords.join(" ")).not.toContain("Ã")
  })

  it("builds canonical and social metadata from one page contract", () => {
    const metadata = buildPageMetadata({
      title: "Página de teste",
      description: "Descrição de teste",
      path: "teste",
    })

    expect(metadata.alternates?.canonical).toBe("/teste")
    expect(metadata.openGraph?.title).toBe("Página de teste | Global English")
    expect(metadata.openGraph?.url).toBe("/teste")
    expect(metadata.twitter?.title).toBe("Página de teste | Global English")
    expect(metadata.robots).toMatchObject({ index: true, follow: true })

    const imageUrl = createOgImageUrl({
      title: "Página de teste | Global English",
      description: "Descrição de teste",
      path: "/teste",
    })
    expect(imageUrl).toContain(`${getMetadataBase().origin}/api/og?`)
    expect(imageUrl).toContain("path=%2Fteste")
  })

  it("marks private or transactional pages as non-indexable", () => {
    const metadata = buildPageMetadata({
      title: "Login",
      description: "Acesso",
      path: "/login",
      noIndex: true,
    })

    expect(metadata.robots).toMatchObject({
      index: false,
      follow: false,
      nocache: true,
      googleBot: expect.objectContaining({
        index: false,
        follow: false,
        noimageindex: true,
      }),
    })
  })

  it("creates safe structured data for the website and educational organization", () => {
    const data = createHomeStructuredData()
    const graph = data["@graph"]

    expect(graph.map((entry) => entry["@type"])).toEqual([
      "WebSite",
      "EducationalOrganization",
    ])
    expect(graph[0]).toMatchObject({
      name: "Global English",
      alternateName: "Global English Learning Hub",
      inLanguage: "pt-BR",
    })
    expect(graph[1]).toMatchObject({
      name: "Global English",
      logo: `${getMetadataBase().origin}/logo.svg`,
    })

    expect(serializeJsonLd({ value: "</script>" })).toBe(
      '{"value":"\\u003c/script>"}'
    )
  })
})
