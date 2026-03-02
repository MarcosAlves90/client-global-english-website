import { ImageResponse } from "next/og"

import { getSiteHost, siteConfig } from "@/lib/seo"

export const runtime = "edge"

function clampText(value: string, limit: number) {
  const text = value.trim()
  if (text.length <= limit) return text
  return `${text.slice(0, limit - 1)}…`
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const title = clampText(
    searchParams.get("title") || siteConfig.title,
    75
  )
  const description = clampText(
    searchParams.get("description") || siteConfig.description,
    140
  )
  const path = searchParams.get("path") || "/"
  const siteHost = getSiteHost()

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background: "linear-gradient(135deg, #15121f 0%, #1e1730 55%, #2b1a4a 100%)",
          color: "#f5f2ff",
          fontFamily: "Inter, Geist, Arial, sans-serif",
          padding: "56px 64px",
        }}
      >
        <div
          style={{
            position: "absolute",
            right: -80,
            top: -120,
            width: 420,
            height: 420,
            borderRadius: 999,
            background: "radial-gradient(circle, rgba(190,126,255,0.55) 0%, rgba(190,126,255,0) 70%)",
          }}
        />

        <div
          style={{
            position: "absolute",
            left: -100,
            bottom: -140,
            width: 460,
            height: 460,
            borderRadius: 999,
            background: "radial-gradient(circle, rgba(121,80,255,0.35) 0%, rgba(121,80,255,0) 72%)",
          }}
        />

        <div
          style={{
            position: "absolute",
            inset: 0,
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: 32,
            margin: 20,
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            zIndex: 2,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 999,
                background: "linear-gradient(135deg, #d7b0ff 0%, #b26dff 55%, #8a4cff 100%)",
                boxShadow: "0 0 40px rgba(178, 109, 255, 0.45)",
              }}
            />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.5 }}>
                Global English
              </span>
              <span style={{ fontSize: 16, color: "rgba(245, 242, 255, 0.75)" }}>
                Plataforma de ensino de inglês
              </span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 22, maxWidth: 980 }}>
            <span
              style={{
                fontSize: 20,
                fontWeight: 600,
                color: "#dbbeff",
                textTransform: "uppercase",
                letterSpacing: 1.5,
              }}
            >
              {path}
            </span>

            <span style={{ fontSize: 66, lineHeight: 1.05, fontWeight: 800, letterSpacing: -2 }}>
              {title}
            </span>

            <span style={{ fontSize: 28, lineHeight: 1.35, color: "rgba(245, 242, 255, 0.86)", maxWidth: 1020 }}>
              {description}
            </span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 18, color: "rgba(245, 242, 255, 0.72)" }}>
              Fluência com trilhas, cursos e atividades em um só lugar
            </span>
            <span
              style={{
                fontSize: 18,
                color: "#ead7ff",
                background: "rgba(178, 109, 255, 0.18)",
                border: "1px solid rgba(219, 190, 255, 0.35)",
                borderRadius: 999,
                padding: "8px 16px",
              }}
            >
              {siteHost}
            </span>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
