import type { Metadata } from "next"

import { buildPageMetadata } from "@/lib/seo"

export const metadata: Metadata = buildPageMetadata({
  title: "Cadastro",
  description: "Informações sobre acesso e cadastro na plataforma Global English.",
  path: "/signup",
})

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children
}
