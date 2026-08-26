import type { Metadata } from "next"

const FALLBACK_URL = "https://global-english-website.netlify.app"

export const siteConfig = {
  name: "Global English",
  productName: "Global English Learning Hub",
  title: "Global English | Plataforma de ensino de inglês",
  description:
    "Cursos de inglês com atividades, materiais, agenda, notas, progresso e feedback do professor em uma plataforma organizada para alunos e educadores.",
  locale: "pt_BR",
  language: "pt-BR",
  category: "education",
  keywords: [
    "curso de inglês",
    "plataforma de ensino de inglês",
    "atividades de inglês",
    "materiais de inglês",
    "aprendizado de inglês",
    "feedback de professor",
    "Global English",
  ],
  url: process.env.NEXT_PUBLIC_SITE_URL ?? FALLBACK_URL,
} as const

export function getMetadataBase() {
  try {
    const url = new URL(siteConfig.url)
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error("Unsupported site URL protocol")
    }
    return new URL(url.origin)
  } catch {
    return new URL(FALLBACK_URL)
  }
}

function getSiteOrigin() {
  return getMetadataBase().origin
}

export function getSiteHost() {
  return getMetadataBase().host
}

function normalizePath(path: string) {
  return path.startsWith("/") ? path : `/${path}`
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
  const canonicalPath = normalizePath(path)
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
  const canonicalPath = normalizePath(path)
  const socialTitle = `${title} | ${siteConfig.name}`
  const ogImageUrl = createOgImageUrl({
    title: socialTitle,
    description,
    path: canonicalPath,
  })

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
      title: socialTitle,
      description,
      url: canonicalPath,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${socialTitle} — compartilhamento`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
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
            "max-video-preview": 0,
            "max-image-preview": "none",
            "max-snippet": 0,
          },
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
          },
        },
  }
}

export function createHomeStructuredData() {
  const origin = getSiteOrigin()
  const websiteId = `${origin}/#website`
  const organizationId = `${origin}/#organization`

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": websiteId,
        url: `${origin}/`,
        name: siteConfig.name,
        alternateName: siteConfig.productName,
        description: siteConfig.description,
        inLanguage: siteConfig.language,
        publisher: { "@id": organizationId },
      },
      {
        "@type": "EducationalOrganization",
        "@id": organizationId,
        url: `${origin}/`,
        name: siteConfig.name,
        description: siteConfig.description,
        logo: `${origin}/logo.svg`,
      },
    ],
  }
}

export function serializeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c")
}
