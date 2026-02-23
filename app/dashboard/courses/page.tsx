"use client"

import * as React from "react"
import {
  BarChart3,
  BookOpen,
  CalendarClock,
  ClipboardList,
  Sparkles,
} from "lucide-react"

import { DashboardHeader } from "@/components/dashboard-header"
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

        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {loading ? (
            <Card>
              <CardContent className="p-6 text-sm text-muted-foreground">
                Carregando cursos...
              </CardContent>
            </Card>
          ) : courses.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-sm text-muted-foreground">
                Você ainda não possui cursos ativos.
              </CardContent>
            </Card>
          ) : (
            courses.map((course) => (
              <Card
                key={course.id}
                className="group flex flex-col h-full overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-neutral-200 dark:border-neutral-800"
              >
                {/* Course Image Header */}
                <div className="relative aspect-video w-full overflow-hidden bg-muted/30 border-b border-neutral-100 dark:border-neutral-800">
                  {course.coverUrl ? (
                    <img
                      src={course.coverUrl}
                      alt={course.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-950/20">
                      <BookOpen className="size-10 text-indigo-200 dark:text-indigo-900/50" />
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className="absolute top-3 left-3">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-sm",
                        ENROLLMENT_STATUS_STYLES[course.enrollment.status] ??
                          ENROLLMENT_STATUS_STYLES.active
                      )}
                    >
                      {ENROLLMENT_STATUS_LABELS[course.enrollment.status] ?? "Em andamento"}
                    </span>
                  </div>

                  {/* Level Badge */}
                  <div className="absolute top-3 right-3">
                    <span className="rounded-full bg-black/60 backdrop-blur-sm px-2.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                      {course.level}
                    </span>
                  </div>
                </div>

                <CardContent className="flex flex-1 flex-col p-5">
                  <div className="mb-4">
                    <h3 className="font-bold text-lg leading-tight text-neutral-900 dark:text-neutral-100 line-clamp-2 min-h-14 group-hover:text-primary transition-colors">
                      {course.title}
                    </h3>
                    <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400 line-clamp-2">
                      {course.description || "Inicie sua jornada neste treinamento exclusivo."}
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* Progress Section */}
                    <div className="space-y-2 rounded-xl border bg-neutral-50/50 dark:bg-neutral-900/50 p-3">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 font-medium text-neutral-500">
                          <BarChart3 className="size-3.5" />
                          Seu Progresso
                        </div>
                        <span className="font-bold text-neutral-900 dark:text-neutral-100">
                          {course.enrollment.progress}%
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-1000 ease-out"
                          style={{ width: `${Math.max(0, Math.min(100, course.enrollment.progress))}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-neutral-400 font-medium">
                      <div className="flex items-center gap-1.5">
                        <ClipboardList className="size-3.5" />
                        {course.tracks.length} módulos
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CalendarClock className="size-3.5" />
                        {course.durationWeeks} sem
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                      <Button className="flex-1 h-9 text-xs font-bold uppercase tracking-wider shadow-sm transition-all hover:shadow-md active:scale-95">
                        Continuar
                      </Button>
                      <Button variant="outline" className="h-9 px-3 text-xs font-bold uppercase tracking-wider transition-all hover:bg-neutral-50 active:scale-95">
                        Detalhes
                      </Button>
                    </div>
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
              <div className="flex items-center gap-3 rounded-2xl border p-3">
                <BookOpen className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Cursos ativos</p>
                  <p className="text-sm font-semibold">{courses.length}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border p-3">
                <ClipboardList className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Módulos</p>
                  <p className="text-sm font-semibold">
                    {courses.reduce((acc, course) => acc + course.tracks.length, 0)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border p-3">
                <BarChart3 className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Progresso médio</p>
                  <p className="text-sm font-semibold">
                    {Math.round(
                      courses.reduce(
                        (acc, course) => acc + (course.enrollment.progress ?? 0),
                        0
                      ) / courses.length
                    )}
                    %
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border p-3 md:col-span-3">
                <Sparkles className="size-4 text-primary" />
                <p className="text-xs text-muted-foreground">
                  Dica: cursos com progresso acima de 70% tendem a ter maior conclusão.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  )
}
