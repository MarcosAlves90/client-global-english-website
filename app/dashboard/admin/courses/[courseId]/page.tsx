"use client"

import * as React from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  ArrowLeft,
  BookOpenCheck,
  ClipboardList,
  Layers3,
  Users2,
  Sparkles,
  Settings2,
  Calendar,
  BarChart3,
  ChevronRight
} from "lucide-react"

import { DashboardHeader } from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/hooks/use-auth"
import type { AdminCourseSummary } from "@/lib/firebase/types"
import { fetchAdminCourses } from "@/modules/courses"
import { cn } from "@/lib/utils"

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
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center p-6">
        <Card className="max-w-md border-destructive/20 bg-destructive/5 text-center">
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center justify-center gap-2">
              <span className="size-2 rounded-full bg-destructive animate-ping" />
              Acesso Restrito
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Esta área é exclusiva para administradores da plataforma.
            <div className="mt-6">
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard">Voltar ao Início</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background/50">
      <DashboardHeader
        title={course?.title ?? "Curso"}
        breadcrumbItems={breadcrumbItems}
        description="Analise métricas e gerencie o conteúdo do curso."
        action={
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="hidden sm:flex hover:bg-primary/5">
              <Link href="/dashboard/admin/courses">
                <ArrowLeft className="mr-2 size-4" />
                Voltar
              </Link>
            </Button>
            <Button asChild size="sm" className="shadow-lg shadow-primary/20">
              <Link href={`/dashboard/admin/courses/${courseId}/manage`}>
                <Settings2 className="mr-2 size-4" />
                Gerenciar
              </Link>
            </Button>
          </div>
        }
      />

      <div className="flex flex-col gap-8 p-6 lg:p-10">
        {!isFirebaseReady ? (
          <div className="rounded-2xl border border-dashed border-amber-500/20 bg-amber-500/5 p-4 text-xs font-medium text-amber-500/80 backdrop-blur-sm animate-in fade-in slide-in-from-top-2">
            Firebase em processo de sincronização...
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-dashed border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive backdrop-blur-sm">
            {error}
          </div>
        ) : null}

        {/* Course Summary Hero Card */}
        <div className="grid gap-6 lg:grid-cols-[1.5fr,1fr]">
          <Card className="relative overflow-hidden border-primary/20 bg-card/40 backdrop-blur-xl group hover:border-primary/30 transition-all duration-500">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <BookOpenCheck className="size-32 text-primary" />
            </div>

            <CardHeader>
              <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-widest text-[10px] mb-2">
                <Sparkles className="size-3" />
                Administração de Conteúdo
              </div>
              <CardTitle className="text-3xl font-bold tracking-tighter sm:text-4xl text-foreground">
                {loadingCourse ? (
                  <div className="h-10 w-64 bg-primary/10 rounded-lg animate-pulse" />
                ) : course?.title ?? "-"}
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="text-muted-foreground leading-relaxed text-sm sm:text-base max-w-xl">
                {course?.description ||
                  (loadingCourse ? (
                    <div className="space-y-2">
                      <div className="h-4 w-full bg-muted/40 rounded animate-pulse" />
                      <div className="h-4 w-3/4 bg-muted/40 rounded animate-pulse" />
                    </div>
                  ) : "Este curso ainda não possui uma descrição estruturada.")}
              </div>

              <div className="flex flex-wrap gap-3">
                {[
                  { label: "Status", value: course?.status, color: "text-primary border-primary/20 bg-primary/5" },
                  { label: "Nível", value: course?.level, color: "text-emerald-500 border-emerald-500/20 bg-emerald-500/5" },
                  { label: "Duração", value: `${course?.durationWeeks} semanas`, color: "text-blue-500 border-blue-500/20 bg-blue-500/5" },
                ].map((tag) => (
                  <span key={tag.label} className={cn("rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-tight", tag.color)}>
                    {tag.value ?? "-"}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats Grid */}
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { label: "Engajamento", value: course?.studentsCount ?? 0, icon: Users2, detail: "Alunos ativos", color: "text-primary" },
              { label: "Estrutura", value: course?.modulesCount ?? 0, icon: Layers3, detail: "Módulos criados", color: "text-emerald-500" },
              { label: "Interações", value: course?.activitiesCount ?? 0, icon: ClipboardList, detail: "Exercícios no total", color: "text-blue-500" },
              { label: "Cronograma", value: course?.durationWeeks ?? 0, icon: Calendar, detail: "Total de semanas", color: "text-purple-500" },
            ].map((item) => (
              <Card key={item.label} className="border-primary/5 bg-card/60 backdrop-blur-md group hover:border-primary/20 hover:-translate-y-1 transition-all duration-300">
                <CardContent className="p-6 flex flex-col justify-between h-full">
                  <div className="flex items-center justify-between mb-4">
                    <div className={cn("size-8 rounded-full flex items-center justify-center bg-current/10", item.color)}>
                      <item.icon className="size-4" />
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground/20 group-hover:text-primary transition-colors" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold tracking-tighter mb-1">{item.value}</div>
                    <div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/40">{item.label}</div>
                    <div className="text-[10px] font-medium text-muted-foreground/60">{item.detail}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick Links Section */}
        <div className="grid gap-6 md:grid-cols-3">
          <Link href={`/dashboard/admin/courses/${courseId}/manage?section=modules`} className="group">
            <Card className="h-full border-dashed border-primary/20 bg-primary/1 hover:bg-primary/5 transition-colors cursor-pointer">
              <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-bold tracking-tight">Gerir Módulos</CardTitle>
                <Layers3 className="size-4 text-primary opacity-50 group-hover:opacity-100 transition-opacity" />
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground leading-relaxed">Organize e ordene os tópicos principais.</p>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/dashboard/admin/courses/${courseId}/manage?section=materials`} className="group">
            <Card className="h-full border-dashed border-emerald-500/20 bg-emerald-500/1 hover:bg-emerald-500/5 transition-colors cursor-pointer">
              <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-bold tracking-tight">Arquivos e Aulas</CardTitle>
                <BookOpenCheck className="size-4 text-emerald-500 opacity-50 group-hover:opacity-100 transition-opacity" />
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground leading-relaxed">Suba PDfs, vídeos e textos markdown.</p>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/dashboard/admin/courses/${courseId}/manage?section=activities`} className="group">
            <Card className="h-full border-dashed border-blue-500/20 bg-blue-500/1 hover:bg-blue-500/5 transition-colors cursor-pointer">
              <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-bold tracking-tight">Banco de Atividades</CardTitle>
                <BarChart3 className="size-4 text-blue-500 opacity-50 group-hover:opacity-100 transition-opacity" />
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground leading-relaxed">Crie quizzes e projetos de avaliação.</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}
