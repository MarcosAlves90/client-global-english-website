import type { Metadata } from "next"

const FALLBACK_URL = "https://globalenglish.com.br"

export const siteConfig = {
  name: "Global English",
  title: "Global English | Plataforma de Inglês",
  description:
    "Plataforma da Global English para acompanhar cursos, trilhas e atividades de inglês com foco em fluência.",
  locale: "pt_BR",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? FALLBACK_URL,
}

export function getMetadataBase() {
  try {
    return new URL(siteConfig.url)
  } catch {
    return new URL(FALLBACK_URL)
  }
}

export function buildPageMetadata({
  title,
  description,
  path = "/",
  noIndex = false,
}: {
  title: string
  description: string
  path?: string
  noIndex?: boolean
}): Metadata {
  const canonicalPath = path.startsWith("/") ? path : `/${path}`

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      type: "website",
      locale: siteConfig.locale,
      siteName: siteConfig.name,
      title,
      description,
      url: canonicalPath,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
          nocache: true,
          googleBot: {
            index: false,
            follow: false,
            noimageindex: true,
            "max-image-preview": "none",
            "max-snippet": -1,
          },
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
          },
        },
  }
}
