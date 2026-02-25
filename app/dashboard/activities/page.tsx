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
import { SummaryCard } from "@/components/summary-card"
import { useAuth } from "@/hooks/use-auth"
import { fetchUserActivities, fetchUserDashboard } from "@/lib/firebase/firestore"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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
      } catch {
        setError("Não foi possível carregar suas atividades.")
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
        action={
          <Button size="sm" variant="outline">
            Ver calendário
          </Button>
        }
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
          <SummaryCard
            label="Atividades liberadas"
            value={activities.length}
            icon={ClipboardCheck}
          />
          <SummaryCard
            label="Tempo estimado"
            value={`${totalMinutes} min`}
            icon={Clock}
          />
          <SummaryCard
            label="Tipos diferentes"
            value={Object.keys(typeCounts).length}
            icon={Target}
          />
          <SummaryCard
            label="Em andamento"
            value={activities.length}
            description="Acompanhe sua lista ativa"
            icon={ListChecks}
          />
        </div>

        {loading ? (
          <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
            Carregando atividades...
          </div>
        ) : activities.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-6 text-center">
            <FolderOpen className="mx-auto size-6 text-muted-foreground" />
            <p className="mt-2 text-sm font-medium">Nenhuma atividade encontrada</p>
            <p className="text-xs text-muted-foreground">
              Assim que seu curso liberar atividades, elas aparecerão aqui.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {activities.map((activity) => (
              <Card key={activity.id}>
                <CardHeader className="space-y-2">
                  <CardTitle className="text-base">{activity.title}</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {activity.courseTitle}
                    {activity.trackTitle ? ` • ${activity.trackTitle}` : ""}
                  </p>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="capitalize">{activity.type}</span>
                    <span className="rounded-full bg-accent/60 px-3 py-1 text-xs">
                      Em andamento
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <Clock className="size-4" />
                    Estimativa: {activity.estimatedMinutes || 0} minutos
                  </div>
                  <div className="flex items-center gap-3">
                    <Button size="sm">Abrir</Button>
                    <Button size="sm" variant="outline">
                      Marcar como concluída
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
