import type { MetadataRoute } from "next"

import { getMetadataBase } from "@/lib/seo"

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = getMetadataBase().origin

  return [
    {
      url: `${origin}/`,
      changeFrequency: "monthly",
      priority: 1,
    },
  ]
}
