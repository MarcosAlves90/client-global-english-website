"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  ClipboardCheck,
  GraduationCap,
  Layers,
  ListChecks,
  Sparkles,
} from "lucide-react"

import { DashboardHeader } from "@/components/dashboard-header"
import { SummaryCard } from "@/components/summary-card"
import { useAuth } from "@/hooks/use-auth"
import { fetchUserDashboard } from "@/lib/firebase/firestore"
import type { DashboardCourse } from "@/lib/firebase/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function Page() {
  const router = useRouter()
  const { user, loading, isFirebaseReady } = useAuth()
  const [courses, setCourses] = React.useState<DashboardCourse[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!loading && !user && isFirebaseReady) {
      router.push("/login")
    }
  }, [loading, user, router, isFirebaseReady])

  React.useEffect(() => {
    async function loadDashboard() {
      if (!user || !isFirebaseReady) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        setError(null)
        const data = await fetchUserDashboard(user.uid)
        setCourses(data)
      } catch {
        setError("Não foi possível carregar seus cursos.")
      } finally {
        setIsLoading(false)
      }
    }

    void loadDashboard()
  }, [user, isFirebaseReady])

  const stats = React.useMemo(
    () => ({
      courses: courses.length,
      tracks: courses.reduce(
        (total, course) => total + course.tracks.length,
        0
      ),
      activities: courses.reduce(
        (total, course) => total + course.activities.length,
        0
      ),
      progress: courses.length
        ? Math.round(
            courses.reduce(
              (sum, course) => sum + course.enrollment.progress,
              0
            ) / courses.length
          )
        : 0,
    }),
    [courses]
  )

  const upcomingActivities = React.useMemo(
    () =>
      courses
        .flatMap((course) =>
          course.activities.map((activity) => ({
            ...activity,
            courseTitle: course.title,
            trackTitle:
              course.tracks.find((track) => track.id === activity.trackId)
                ?.title ?? "",
          }))
        )
        .sort((a, b) => a.order - b.order)
        .slice(0, 4),
    [courses]
  )

  return (
    <div>
      <DashboardHeader
        title="Painel do aluno"
        description="Acompanhe seus cursos, trilhas e atividades atuais."
      />

      <div className="flex flex-1 flex-col gap-6 p-6">
        {!isFirebaseReady ? (
          <div className="rounded-2xl border border-dashed bg-accent/40 p-4 text-sm text-muted-foreground">
            Firebase não configurado. Conecte para visualizar seus cursos reais.
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-dashed border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Cursos ativos"
            value={stats.courses}
            description="Matrículas atuais"
            icon={GraduationCap}
          />
          <SummaryCard
            label="Trilhas"
            value={stats.tracks}
            description="Módulos em andamento"
            icon={Layers}
          />
          <SummaryCard
            label="Atividades"
            value={stats.activities}
            description="Itens liberados"
            icon={ClipboardCheck}
          />
          <SummaryCard
            label="Progresso médio"
            value={`${stats.progress}%`}
            description="Resumo da turma"
            icon={ListChecks}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <CardHeader className="flex items-center justify-between gap-2 sm:flex-row">
              <div>
                <CardTitle className="text-base">Cursos ativos</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Acesse rapidamente seus módulos e progresso.
                </p>
              </div>
              <Button variant="outline" size="sm">
                Ver catálogo
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-sm text-muted-foreground">
                  Carregando seus cursos...
                </p>
              ) : courses.length ? (
                <div className="space-y-4">
                  {courses.map((course) => (
                    <div
                      key={course.id}
                      className="rounded-2xl border p-4 transition-colors hover:border-primary/40"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold">{course.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {course.description ||
                              "Plano de estudos com foco em conversação."}
                          </p>
                        </div>
                        <span className="rounded-full bg-accent/60 px-3 py-1 text-xs">
                          {course.enrollment.progress}% concluído
                        </span>
                      </div>
                      <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                        <span>{course.level}</span>
                        <span>{course.tracks.length} módulos</span>
                        <span>{course.activities.length} atividades</span>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{
                            width: `${Math.max(
                              0,
                              Math.min(100, course.enrollment.progress)
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-2 rounded-2xl border border-dashed p-6 text-center">
                  <GraduationCap className="mx-auto size-6 text-muted-foreground" />
                  <p className="text-sm font-medium">
                    Nenhum curso atribuído ainda
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Quando você for matriculado, seus cursos aparecerão aqui.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-base">Próximas atividades</CardTitle>
              <p className="text-sm text-muted-foreground">
                Itens liberados recentemente para você continuar.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingActivities.length ? (
                upcomingActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="rounded-2xl border bg-background p-3"
                  >
                    <p className="text-sm font-medium">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {activity.courseTitle}
                      {activity.trackTitle ? ` • ${activity.trackTitle}` : ""}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed p-4 text-xs text-muted-foreground">
                  Nenhuma atividade disponível no momento.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {courses.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resumo de carga</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3">
              <SummaryCard
                label="Cursos ativos"
                value={courses.length}
                icon={GraduationCap}
              />
              <SummaryCard
                label="Módulos"
                value={courses.reduce(
                  (acc, course) => acc + course.tracks.length,
                  0
                )}
                icon={Layers}
              />
              <SummaryCard
                label="Progresso médio"
                value={`${Math.round(
                  courses.reduce(
                    (acc, course) => acc + (course.enrollment.progress ?? 0),
                    0
                  ) / courses.length
                )}%`}
                icon={ListChecks}
              />
              <div className="flex items-center gap-3 rounded-2xl border p-3 md:col-span-3">
                <Sparkles className="size-4 text-primary" />
                <p className="text-xs text-muted-foreground">
                  Dica: cursos com progresso acima de 70% tendem a ter maior
                  conclusão.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  )
}
