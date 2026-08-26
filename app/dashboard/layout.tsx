import type { Metadata } from "next"

import { DashboardLayoutClient } from "./dashboard-layout-client"
import { buildPageMetadata } from "@/lib/seo"

export const metadata: Metadata = {
  ...buildPageMetadata({
    title: "Dashboard",
    description:
      "Área autenticada da Global English para alunos, professores e administradores acompanharem cursos, atividades, agenda, notas e progresso.",
    path: "/dashboard",
    noIndex: true,
  }),
  title: {
    default: "Dashboard",
    template: "%s | Global English",
  },
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>
}
