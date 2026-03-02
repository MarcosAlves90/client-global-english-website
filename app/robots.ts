import type { MetadataRoute } from "next"

import { getMetadataBase } from "@/lib/seo"

export default function robots(): MetadataRoute.Robots {
  const base = getMetadataBase()

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/login", "/signup"],
        disallow: ["/dashboard", "/update-password", "/api"],
      },
    ],
    sitemap: `${base.origin}/sitemap.xml`,
    host: base.origin,
  }
}
