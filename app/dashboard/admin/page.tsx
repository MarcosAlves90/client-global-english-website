"use client"

import * as React from "react"
import { GraduationCap, LayoutDashboard, Users2 } from "lucide-react"

import { DashboardHeader } from "@/components/dashboard-header"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { fetchAdminOverview } from "@/lib/firebase/firestore"
import { AdminNavCard } from "@/components/admin/admin-nav-card"
import type { AdminOverview } from "@/lib/firebase/types"

export default function Page() {
  const { role, isFirebaseReady } = useAuth()
  const [overview, setOverview] = React.useState<AdminOverview | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!isFirebaseReady || role !== "admin") {
      return
    }

    let isMounted = true

    const loadOverview = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await fetchAdminOverview()
        if (isMounted) {
          setOverview(data)
        }
      } catch {
        if (isMounted) {
          setError("Não foi possível carregar os indicadores.")
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadOverview()

    return () => {
      isMounted = false
    }
  }, [isFirebaseReady, role])

  if (role !== "admin") {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Acesso restrito</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Esta área é exclusiva para administradores.
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div>
      <DashboardHeader
        title="Admin"
        description="Visão geral do desempenho e gestão da plataforma."
        action={<Button size="sm">Novo relatório</Button>}
      />

      <div className="flex flex-col gap-6 p-6">
        {!isFirebaseReady ? (
          <div className="rounded-2xl border border-dashed bg-accent/40 p-4 text-sm text-muted-foreground">
            Firebase não configurado. Conecte para visualizar dados reais.
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-dashed border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-primary/5 bg-primary/1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium">Usuários ativos</CardTitle>
              <Users2 className="size-4 text-primary/60" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight">
                {loading ? "..." : overview?.usersCount ?? "-"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Total cadastrado na plataforma</p>
            </CardContent>
          </Card>
          <Card className="border-primary/5 bg-primary/1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium">Cursos ativos</CardTitle>
              <GraduationCap className="size-4 text-primary/60" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight">
                {loading ? "..." : overview?.coursesCount ?? "-"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Total publicado e disponível</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <LayoutDashboard className="size-5 text-primary" />
            <h2 className="text-lg font-semibold tracking-tight">Gestão do Sistema</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <AdminNavCard
              title="Gestão de Usuários"
              description="Gerencie contas de alunos, professores e administradores. Altere permissões e visualize perfis."
              href="/dashboard/admin/users"
              icon={Users2}
            />
            <AdminNavCard
              title="Gestão de Cursos"
              description="Administre trilhas de aprendizado, módulos e materiais. Publique novos conteúdos ou edite existentes."
              href="/dashboard/admin/courses"
              icon={GraduationCap}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
