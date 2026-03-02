import type { Metadata } from "next"

import { buildPageMetadata } from "@/lib/seo"

export const metadata: Metadata = buildPageMetadata({
  title: "Criar Conta",
  description:
    "Crie sua conta na Global English para acessar trilhas de estudo e materiais exclusivos.",
  path: "/signup",
})

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
