import type { MetadataRoute } from "next"

import { getMetadataBase } from "@/lib/seo"

export default function robots(): MetadataRoute.Robots {
  const origin = getMetadataBase().origin

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/api/og"],
        disallow: ["/dashboard", "/update-password", "/api/"],
      },
    ],
    sitemap: `${origin}/sitemap.xml`,
    host: origin,
  }
}
