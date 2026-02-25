"use client"

import * as React from "react"
import Image from "next/image"
import {
  BarChart3,
  BookOpen,
  CalendarClock,
  ClipboardList,
  Sparkles,
} from "lucide-react"

import { DashboardHeader } from "@/components/dashboard-header"
import { SummaryCard } from "@/components/summary-card"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { fetchUserDashboard } from "@/lib/firebase/firestore"
import { cn } from "@/lib/utils"
import type { DashboardCourse } from "@/lib/firebase/types"

const ENROLLMENT_STATUS_LABELS: Record<string, string> = {
  active: "Em andamento",
  completed: "Concluído",
  paused: "Pausado",
}

const ENROLLMENT_STATUS_STYLES: Record<string, string> = {
  active:
    "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800/50",
  completed:
    "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800/50",
  paused:
    "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800/50",
}

export default function Page() {
  const { isFirebaseReady, user } = useAuth()
  const [courses, setCourses] = React.useState<DashboardCourse[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const loadCourses = React.useCallback(async () => {
    if (!isFirebaseReady || !user) {
      setCourses([])
      return
    }

    try {
      setLoading(true)
      setError(null)
      const data = await fetchUserDashboard(user.uid)
      setCourses(data)
    } catch {
      setError("Não foi possível carregar seus cursos.")
    } finally {
      setLoading(false)
    }
  }, [isFirebaseReady, user])

  React.useEffect(() => {
    if (!isFirebaseReady || !user) {
      setCourses([])
      return
    }

    void loadCourses()
  }, [isFirebaseReady, user, loadCourses])

  const stats = React.useMemo(
    () => ({
      courses: courses.length,
      tracks: courses.reduce((acc, course) => acc + course.tracks.length, 0),
      activities: courses.reduce(
        (acc, course) => acc + course.activities.length,
        0
      ),
      avgProgress: courses.length
        ? Math.round(
            courses.reduce(
              (acc, course) => acc + (course.enrollment.progress ?? 0),
              0
            ) / courses.length
          )
        : 0,
    }),
    [courses]
  )

  return (
    <div>
      <DashboardHeader
        title="Cursos"
        description="Gerencie seus cursos ativos e descubra novas trilhas."
        action={
          <Button size="sm" onClick={() => void loadCourses()} disabled={loading}>
            {loading ? "Atualizando..." : "Atualizar"}
          </Button>
        }
      />

      <div className="flex flex-col gap-6 p-6">
        {!isFirebaseReady ? (
          <div className="rounded-2xl border border-dashed bg-accent/40 p-4 text-sm text-muted-foreground">
            Firebase não configurado. Conecte para visualizar seus cursos.
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-dashed border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Cursos" value={stats.courses} icon={BookOpen} />
          <SummaryCard label="Módulos" value={stats.tracks} icon={ClipboardList} />
          <SummaryCard
            label="Atividades"
            value={stats.activities}
            icon={BarChart3}
          />
          <SummaryCard
            label="Progresso médio"
            value={`${stats.avgProgress}%`}
            icon={Sparkles}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {loading ? (
            <Card>
              <CardContent className="p-6 text-sm text-muted-foreground">
                Carregando cursos...
              </CardContent>
            </Card>
          ) : courses.length === 0 ? (
            <Card className="sm:col-span-2 lg:col-span-3 xl:col-span-4">
              <CardContent className="p-6 text-sm text-muted-foreground">
                Você ainda não possui cursos ativos.
              </CardContent>
            </Card>
          ) : (
            courses.map((course) => (
              <Card
                key={course.id}
                className="group flex h-full flex-col overflow-hidden border-muted-foreground/20 transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="relative aspect-video w-full overflow-hidden bg-muted/30">
                  {course.coverUrl ? (
                    <Image
                      src={course.coverUrl}
                      alt={course.title}
                      fill
                      sizes="(min-width: 1536px) 25vw, (min-width: 1280px) 33vw, (min-width: 1024px) 50vw, 100vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-950/20">
                      <BookOpen className="size-10 text-indigo-200 dark:text-indigo-900/50" />
                    </div>
                  )}

                  <div className="absolute left-3 top-3">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                        ENROLLMENT_STATUS_STYLES[course.enrollment.status] ??
                          ENROLLMENT_STATUS_STYLES.active
                      )}
                    >
                      {ENROLLMENT_STATUS_LABELS[course.enrollment.status] ??
                        "Em andamento"}
                    </span>
                  </div>

                  <div className="absolute right-3 top-3">
                    <span className="rounded-full bg-black/60 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                      {course.level}
                    </span>
                  </div>
                </div>

                <CardContent className="flex flex-1 flex-col gap-4 p-4">
                  <div>
                    <h3 className="text-base font-semibold leading-tight text-foreground line-clamp-2">
                      {course.title}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                      {course.description ||
                        "Inicie sua jornada neste treinamento exclusivo."}
                    </p>
                  </div>

                  <div className="space-y-2 rounded-xl border bg-muted/30 p-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Progresso</span>
                      <span className="font-semibold text-foreground">
                        {course.enrollment.progress}%
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{
                          width: `${Math.max(
                            0,
                            Math.min(100, course.enrollment.progress)
                          )}%`,
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <ClipboardList className="size-3.5" />
                        {course.tracks.length} módulos
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CalendarClock className="size-3.5" />
                        {course.durationWeeks} sem
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto flex items-center gap-2">
                    <Button className="flex-1" size="sm">
                      Continuar
                    </Button>
                    <Button variant="outline" size="sm">
                      Detalhes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
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
                icon={BookOpen}
              />
              <SummaryCard
                label="Módulos"
                value={stats.tracks}
                icon={ClipboardList}
              />
              <SummaryCard
                label="Progresso médio"
                value={`${stats.avgProgress}%`}
                icon={BarChart3}
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
