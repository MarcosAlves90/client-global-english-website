"use client"

import * as React from "react"
import {
  ClipboardCheck,
  Clock,
  FolderOpen,
  ListChecks,
  Target,
} from "lucide-react"

import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSectionHeader } from "@/components/dashboard-section-header"
import { DashboardStatCard } from "@/components/dashboard-stat-card"
import { StudentActivityCard } from "@/modules/activities/ui/student-activity-card"
import { useAuth } from "@/hooks/use-auth"
import { toFriendlyFirestoreLoadError } from "@/lib/firebase/error-message"
import { fetchUserActivities, fetchUserDashboard } from "@/lib/firebase/firestore"


type ActivityView = {
  id: string
  title: string
  courseTitle: string
  trackTitle: string
  type: string
  estimatedMinutes: number
}

export default function Page() {
  const { user, isFirebaseReady } = useAuth()
  const [activities, setActivities] = React.useState<ActivityView[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    async function loadActivities() {
      if (!user || !isFirebaseReady) {
        return
      }

      setLoading(true)
      try {
        setError(null)
        const [dashboard, items] = await Promise.all([
          fetchUserDashboard(user.uid),
          fetchUserActivities(user.uid),
        ])
        const trackById = new Map(
          dashboard.flatMap((course) =>
            course.tracks.map((track) => [track.id, track.title] as const)
          )
        )
        const courseById = new Map(
          dashboard.map((course) => [course.id, course.title] as const)
        )
        const flattened: ActivityView[] = items.map((activity) => ({
          id: activity.id,
          title: activity.title,
          courseTitle: courseById.get(activity.courseId) ?? "",
          trackTitle: trackById.get(activity.trackId) ?? "",
          type: activity.type,
          estimatedMinutes: activity.estimatedMinutes,
        }))
        setActivities(flattened)
      } catch (error) {
        setError(
          toFriendlyFirestoreLoadError(
            error,
            "Não foi possível carregar suas atividades."
          )
        )
      } finally {
        setLoading(false)
      }
    }

    void loadActivities()
  }, [user, isFirebaseReady])

  const totalMinutes = React.useMemo(
    () =>
      activities.reduce(
        (acc, activity) => acc + (activity.estimatedMinutes || 0),
        0
      ),
    [activities]
  )
  const typeCounts = React.useMemo(
    () =>
      activities.reduce<Record<string, number>>((acc, activity) => {
        acc[activity.type] = (acc[activity.type] ?? 0) + 1
        return acc
      }, {}),
    [activities]
  )

  return (
    <div>
      <DashboardHeader
        title="Atividades"
        description="Acompanhe pendências, entregas e feedbacks das aulas."
      />

      <div className="flex flex-col gap-6 p-6">
        {!isFirebaseReady ? (
          <div className="rounded-2xl border border-dashed bg-accent/40 p-4 text-sm text-muted-foreground">
            Firebase não configurado. Conecte para visualizar suas atividades reais.
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-dashed border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <DashboardStatCard
            title="Atividades liberadas"
            value={activities.length}
            icon={ClipboardCheck}
          />
          <DashboardStatCard
            title="Tempo estimado"
            value={`${totalMinutes} min`}
            icon={Clock}
          />
          <DashboardStatCard
            title="Tipos diferentes"
            value={Object.keys(typeCounts).length}
            icon={Target}
          />
          <DashboardStatCard
            title="Em andamento"
            value={activities.length}
            icon={ListChecks}
          />
        </div>

        <DashboardSectionHeader
          title="Minhas Atividades"
          description="Acompanhe pendências, entregas e feedbacks das aulas."
          icon={ClipboardCheck}
        />

        {loading ? (
          <div className="flex h-64 items-center justify-center text-muted-foreground animate-pulse">
            Preparando suas tarefas...
          </div>
        ) : activities.length === 0 ? (
          <div className="flex flex-col gap-4 rounded-2xl border border-dashed border-primary/20 bg-primary/5 p-12 text-center backdrop-blur-sm">
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <FolderOpen className="size-8" />
            </div>
            <div className="space-y-1">
              <p className="text-lg font-bold tracking-tight text-foreground">
                Nenhuma atividade encontrada
              </p>
              <p className="text-sm text-muted-foreground/60">
                Assim que seu curso liberar atividades, elas aparecerão aqui.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {activities.map((activity) => (
              <StudentActivityCard
                key={activity.id}
                activity={{
                  ...activity,
                  status: "in_progress",
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
