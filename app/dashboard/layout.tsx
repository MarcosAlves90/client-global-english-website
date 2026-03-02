import type { Metadata } from "next"

import { DashboardLayoutClient } from "./dashboard-layout-client"
import { buildPageMetadata } from "@/lib/seo"

export const metadata: Metadata = {
  ...buildPageMetadata({
    title: "Área do Aluno",
    description:
      "Painel interno da Global English para acompanhamento de cursos, atividades e progresso.",
    path: "/dashboard",
    noIndex: true,
  }),
  title: {
    default: "Área do Aluno",
    template: "%s | Dashboard Global English",
  },
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>
}
