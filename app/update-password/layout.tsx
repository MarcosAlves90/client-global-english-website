import type { Metadata } from "next"

import { buildPageMetadata } from "@/lib/seo"

export const metadata: Metadata = buildPageMetadata({
  title: "Atualizar Senha",
  description:
    "Atualize sua senha para continuar acessando a plataforma Global English com segurança.",
  path: "/update-password",
  noIndex: true,
})

export default function UpdatePasswordLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
