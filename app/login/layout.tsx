import type { Metadata } from "next"

import { buildPageMetadata } from "@/lib/seo"

export const metadata: Metadata = buildPageMetadata({
  title: "Login",
  description:
    "Acesse sua conta na plataforma Global English para continuar seus cursos e atividades.",
  path: "/login",
})

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
