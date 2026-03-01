"use client"

import * as React from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, BookOpenCheck, ClipboardList, Layers3, Users2 } from "lucide-react"

import { DashboardHeader } from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/hooks/use-auth"
import type { AdminCourseSummary } from "@/lib/firebase/types"
import { fetchAdminCourses } from "@/modules/courses"

export default function Page() {
  const { role, isFirebaseReady, user } = useAuth()
  const params = useParams<{ courseId?: string }>()
  const courseId = Array.isArray(params?.courseId)
    ? params.courseId[0]
    : params?.courseId

  const [course, setCourse] = React.useState<AdminCourseSummary | null>(null)
  const [loadingCourse, setLoadingCourse] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const breadcrumbItems = React.useMemo(
    () => [
      { label: "Admin", href: "/dashboard/admin" },
      { label: "Cursos", href: "/dashboard/admin/courses" },
      { label: course?.title ?? "Curso" },
    ],
    [course?.title]
  )

  const loadCourse = React.useCallback(async (force?: boolean) => {
    if (!courseId) {
      setError("Curso inválido.")
      return
    }

    try {
      setLoadingCourse(true)
      setError(null)
      const idToken = user ? await user.getIdToken() : null
      const data = await fetchAdminCourses(idToken, { force })
      const match = data.find((item) => item.id === courseId) ?? null
      setCourse(match)
      if (!match) {
        setError("Curso não encontrado.")
      }
    } catch {
      setError("Não foi possível carregar o curso.")
    } finally {
      setLoadingCourse(false)
    }
  }, [courseId, user])

  React.useEffect(() => {
    if (!isFirebaseReady || role !== "admin") {
      return
    }

    void loadCourse()
  }, [isFirebaseReady, role, loadCourse])

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
        title={course?.title ?? "Curso"}
        breadcrumbItems={breadcrumbItems}
        description="Detalhes gerais, métricas e acesso ao gerenciamento do curso."
        action={
          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href="/dashboard/admin/courses">
                <ArrowLeft className="size-4" />
                Voltar para cursos
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href={`/dashboard/admin/courses/${courseId}/manage`}>
                Gerenciar curso
              </Link>
            </Button>
          </div>
        }
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

        <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-base">Resumo do curso</CardTitle>
              <p className="text-sm text-muted-foreground">
                Contexto, status e objetivo do treinamento.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Curso
                </p>
                <p className="text-lg font-semibold text-foreground">
                  {loadingCourse ? "Carregando..." : course?.title ?? "-"}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                {course?.description ||
                  (loadingCourse ? "Carregando detalhes..." : "Sem descrição.")}
              </p>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span className="rounded-full border px-2 py-1">
                  Status: {course?.status ?? "-"}
                </span>
                <span className="rounded-full border px-2 py-1">
                  Nível: {course?.level ?? "-"}
                </span>
                <span className="rounded-full border px-2 py-1">
                  Duração: {course?.durationWeeks ?? "-"} semanas
                </span>
              </div>
            </CardContent>
          </Card>

          <div />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Indicadores</CardTitle>
            <p className="text-sm text-muted-foreground">
              Visão rápida do volume de conteúdo e engajamento.
            </p>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Usuários", value: course?.studentsCount ?? 0, icon: Users2 },
              { label: "Módulos", value: course?.modulesCount ?? 0, icon: Layers3 },
              { label: "Atividades", value: course?.activitiesCount ?? 0, icon: ClipboardList },
              { label: "Semanas", value: course?.durationWeeks ?? 0, icon: BookOpenCheck },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border p-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="uppercase tracking-wide">{item.label}</span>
                  <item.icon className="size-4" />
                </div>
                <div className="mt-2 text-2xl font-semibold text-foreground">
                  {item.value}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
