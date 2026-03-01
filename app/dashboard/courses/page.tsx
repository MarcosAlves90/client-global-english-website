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
import { DashboardSectionHeader } from "@/components/dashboard-section-header"
import { DashboardStatCard } from "@/components/dashboard-stat-card"
import { StudentCourseCard } from "@/modules/courses/ui/student-course-card"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { fetchUserDashboard } from "@/lib/firebase/firestore"
import type { DashboardCourse } from "@/lib/firebase/types"

// Status constants removed as they are now handled by StudentCourseCard

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
          <DashboardStatCard title="Cursos" value={stats.courses} icon={BookOpen} />
          <DashboardStatCard title="Módulos" value={stats.tracks} icon={ClipboardList} />
          <DashboardStatCard
            title="Atividades"
            value={stats.activities}
            icon={BarChart3}
          />
          <DashboardStatCard
            title="Progresso médio"
            value={`${stats.avgProgress}%`}
            icon={Sparkles}
          />
        </div>

        <DashboardSectionHeader
          title="Meus Conteúdos"
          description="Acesse seus cursos e acompanhe sua evolução."
          icon={BookOpen}
        />

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {loading ? (
            <div className="col-span-full flex h-64 items-center justify-center text-muted-foreground animate-pulse">
              Organizando seus materiais...
            </div>
          ) : courses.length === 0 ? (
            <div className="col-span-full flex flex-col gap-4 rounded-2xl border border-dashed border-primary/10 bg-primary/5 p-12 text-center backdrop-blur-sm">
              <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <BookOpen className="size-8" />
              </div>
              <div className="space-y-1">
                <p className="text-lg font-bold tracking-tight text-foreground">
                  Nenhum curso ativo
                </p>
                <p className="text-sm text-muted-foreground/60">
                  Você ainda não possui matrículas ativas na plataforma.
                </p>
              </div>
            </div>
          ) : (
            courses.map((course) => (
              <StudentCourseCard key={course.id} course={course} />
            ))
          )}
        </div>

        {/* Summary Footer removed as it's redundant with StatCards */}
      </div>
    </div>
  )
}
