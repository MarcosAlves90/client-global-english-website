import type { Metadata } from "next"

const FALLBACK_URL = "https://global-english-website.netlify.app"

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

export function getSiteOrigin() {
  return getMetadataBase().origin
}

export function getSiteHost() {
  return getMetadataBase().host
}

export function createOgImageUrl({
  title,
  description,
  path = "/",
}: {
  title: string
  description: string
  path?: string
}) {
  const canonicalPath = path.startsWith("/") ? path : `/${path}`
  const params = new URLSearchParams({
    title,
    description,
    path: canonicalPath,
  })

  return `${getSiteOrigin()}/api/og?${params.toString()}`
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
  const ogImageUrl = createOgImageUrl({ title, description, path: canonicalPath })

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
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${title} | ${siteConfig.name}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
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
