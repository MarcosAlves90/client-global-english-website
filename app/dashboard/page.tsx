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
import { DashboardSectionHeader } from "@/components/dashboard-section-header"
import { DashboardStatCard } from "@/components/dashboard-stat-card"
import { StudentCourseCard } from "@/modules/courses/ui/student-course-card"
import { StudentActivityCard } from "@/modules/activities/ui/student-activity-card"
import { useAuth } from "@/hooks/use-auth"
import { fetchUserActivityProgressList, fetchUserDashboard } from "@/lib/firebase/firestore"
import { toFriendlyFirestoreLoadError } from "@/lib/firebase/error-message"
import type { DashboardCourse } from "@/lib/firebase/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function Page() {
  const router = useRouter()
  const { user, loading, isFirebaseReady } = useAuth()
  const [courses, setCourses] = React.useState<DashboardCourse[]>([])
  const [progressByActivityId, setProgressByActivityId] = React.useState<Map<string, "not_started" | "in_progress" | "completed">>(new Map())
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
        const [data, progressList] = await Promise.all([
          fetchUserDashboard(user.uid),
          fetchUserActivityProgressList(user.uid),
        ])
        const nextProgressMap = new Map(
          progressList.map((item) => [item.activityId, item.status] as const)
        )
        setCourses(data)
        setProgressByActivityId(nextProgressMap)
      } catch (error) {
        setError(
          toFriendlyFirestoreLoadError(
            error,
            "Não foi possível carregar seus cursos."
          )
        )
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
            status:
              progressByActivityId.get(activity.id) === "completed"
                ? "completed"
                : progressByActivityId.get(activity.id) === "in_progress"
                  ? "in_progress"
                  : "pending",
            courseTitle: course.title,
            trackTitle:
              course.tracks.find((track) => track.id === activity.trackId)
                ?.title ?? "",
          }))
        )
        .filter((activity) => activity.status !== "completed")
        .sort((a, b) => a.order - b.order)
        .slice(0, 4),
    [courses, progressByActivityId]
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
          <DashboardStatCard
            title="Cursos ativos"
            value={stats.courses}
            icon={GraduationCap}
            description="Cursos em andamento"
          />
          <DashboardStatCard
            title="Trilhas"
            value={stats.tracks}
            icon={Layers}
            description="Módulos disponíveis"
          />
          <DashboardStatCard
            title="Atividades"
            value={stats.activities}
            icon={ClipboardCheck}
            description="Total de atividades"
          />
          <DashboardStatCard
            title="Progresso médio"
            value={`${stats.progress}%`}
            icon={ListChecks}
            description="Conclusão geral"
          />
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <DashboardSectionHeader
              title="Meus Cursos"
              description="Continue de onde parou para manter seu ritmo de aprendizado."
              icon={GraduationCap}
            />

            <div className="grid gap-6">
              {isLoading ? (
                <div className="flex items-center justify-center p-12 text-muted-foreground animate-pulse">
                  Carregando sua jornada...
                </div>
              ) : courses.length ? (
                <div className="grid gap-6 sm:grid-cols-2">
                  {courses.map((course) => (
                    <StudentCourseCard key={course.id} course={course} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-4 rounded-3xl bg-card/40 backdrop-blur-md border-primary/20 hover:bg-primary/5 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1 p-12 text-center">
                  <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <GraduationCap className="size-8" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-lg font-bold tracking-tight text-foreground">
                      Nenhum curso atribuído
                    </p>
                    <p className="text-sm text-muted-foreground/60">
                      Sua jornada está prestes a começar. Fique atento!
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <DashboardSectionHeader
              title="Próximos Passos"
              description="Atividades recentes."
              icon={Sparkles}
            />

            <div className="space-y-4">
              {upcomingActivities.length ? (
                upcomingActivities.map((activity) => (
                  <StudentActivityCard
                    key={activity.id}
                    activity={{
                      ...activity,
                      status: activity.status,
                    }}
                    variant="compact"
                    onOpen={(id) => router.push(`/dashboard/activities/${id}`)}
                  />
                ))
              ) : (
                <div className="space-y-2.5 rounded-2xl border border-primary/5 bg-primary/5 p-4 group-hover:bg-primary/10 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Nenhuma tarefa pendente</span>
                  </div>
                </div>
              )}
            </div>

            {courses.length > 0 && (
              <Card className="overflow-hidden border-primary/20 bg-primary/5 backdrop-blur-sm gap-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold uppercase tracking-widest text-primary/60 flex items-center gap-2">
                    <Sparkles className="size-4" />
                    Insight de hoje
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs font-medium leading-relaxed text-muted-foreground">
                    Alunos que mantêm uma rotina de 15 minutos diários têm 3x mais chances de atingir a fluência em 1 ano.
                    <span className="block mt-2 font-bold text-primary/80">Keep going! 🚀</span>
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Summary Footer removed as it's redundant with StatCards */}
      </div>
    </div>
  )
}
