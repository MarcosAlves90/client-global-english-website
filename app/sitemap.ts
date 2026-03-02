import type { MetadataRoute } from "next"

import { getMetadataBase } from "@/lib/seo"

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getMetadataBase().origin
  const now = new Date()

  return [
    {
      url: `${base}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${base}/login`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${base}/signup`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ]
}
