import { describe, expect, it } from "vitest"

import robots from "@/app/robots"
import sitemap from "@/app/sitemap"
import { metadata as loginMetadata } from "@/app/login/layout"
import { metadata as signupMetadata } from "@/app/signup/layout"
import { getMetadataBase } from "@/lib/seo"

describe("SEO route policy", () => {
  it("publishes only the public landing page in the sitemap", () => {
    expect(sitemap()).toEqual([
      {
        url: `${getMetadataBase().origin}/`,
        changeFrequency: "monthly",
        priority: 1,
      },
    ])
  })

  it("keeps private application routes out of crawler access while exposing metadata assets", () => {
    expect(robots()).toEqual({
      rules: [
        {
          userAgent: "*",
          allow: ["/", "/api/og"],
          disallow: ["/dashboard", "/update-password", "/api/"],
        },
      ],
      sitemap: `${getMetadataBase().origin}/sitemap.xml`,
      host: getMetadataBase().origin,
    })
  })

  it("keeps authentication pages crawlable for noindex discovery but out of search results", () => {
    expect(loginMetadata.robots).toMatchObject({ index: false, follow: false })
    expect(signupMetadata.robots).toMatchObject({ index: false, follow: false })
    expect(loginMetadata.alternates?.canonical).toBe("/login")
    expect(signupMetadata.alternates?.canonical).toBe("/signup")
  })
})
