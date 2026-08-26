"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ClipboardCheck } from "lucide-react"

import { DashboardEmptyState, DashboardNotice } from "@/components/dashboard/dashboard-feedback"
import { DashboardPage } from "@/components/dashboard/dashboard-page"
import { SearchField } from "@/components/dashboard/search-field"
import { SegmentedControl } from "@/components/dashboard/segmented-control"
import { useAuth } from "@/hooks/use-auth"
import { parseActivityDate } from "@/lib/activities/deadlines"
import { toFriendlyFirestoreLoadError } from "@/lib/firebase/error-message"
import { fetchUserActivities, fetchUserActivityProgressList, fetchUserDashboard } from "@/lib/firebase/firestore"
import { StudentActivityCard } from "@/modules/activities/ui/student-activity-card"

type ActivityView = { id: string; title: string; courseTitle: string; trackTitle: string; type: string; estimatedMinutes: number; dueAt?: Date | string | null; closeAt?: Date | string | null; status: "pending" | "completed" | "in_progress"; gradingStatus?: "pending" | "revision_requested" | "graded" }
type StatusFilter = "pending" | "in_progress" | "revision" | "completed"

export default function Page() {
  const router = useRouter()
  const { user, isFirebaseReady } = useAuth()
  const [activities, setActivities] = React.useState<ActivityView[]>([])
  const [filter, setFilter] = React.useState<StatusFilter>("pending")
  const [query, setQuery] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    async function load() {
      if (!user || !isFirebaseReady) return
      try {
        setLoading(true); setError(null)
        const [dashboard, items, progressItems] = await Promise.all([fetchUserDashboard(user.uid), fetchUserActivities(user.uid), fetchUserActivityProgressList(user.uid)])
        const progressById = new Map(progressItems.map((item) => [item.activityId, item] as const))
        const trackById = new Map(dashboard.flatMap((course) => course.tracks.map((track) => [track.id, track.title] as const)))
        const courseById = new Map(dashboard.map((course) => [course.id, course.title] as const))
        setActivities(items.map((activity) => { const item = progressById.get(activity.id); return { id: activity.id, title: activity.title, courseTitle: courseById.get(activity.courseId) ?? "", trackTitle: trackById.get(activity.trackId) ?? "", type: activity.type, estimatedMinutes: activity.estimatedMinutes, dueAt: activity.dueAt, closeAt: activity.closeAt, status: item?.status === "completed" ? "completed" : item ? "in_progress" : "pending", gradingStatus: item?.gradingStatus } }))
      } catch (loadError) { setError(toFriendlyFirestoreLoadError(loadError, "Não foi possível carregar suas atividades.")) }
      finally { setLoading(false) }
    }
    void load()
  }, [isFirebaseReady, user])

  const counts = React.useMemo(() => ({
    pending: activities.filter((item) => item.status === "pending").length,
    in_progress: activities.filter((item) => item.status === "in_progress" && item.gradingStatus !== "revision_requested").length,
    revision: activities.filter((item) => item.gradingStatus === "revision_requested").length,
    completed: activities.filter((item) => item.status === "completed").length,
  }), [activities])

  const filtered = React.useMemo(() => activities.filter((item) => {
    const q = query.trim().toLocaleLowerCase("pt-BR")
    const matchesQuery = !q || `${item.title} ${item.courseTitle} ${item.trackTitle}`.toLocaleLowerCase("pt-BR").includes(q)
    const matchesStatus = filter === "revision" ? item.gradingStatus === "revision_requested" : filter === "completed" ? item.status === "completed" : filter === "in_progress" ? item.status === "in_progress" && item.gradingStatus !== "revision_requested" : item.status === "pending"
    return matchesQuery && matchesStatus
  }).sort((a, b) => {
    const ad = parseActivityDate(a.dueAt)?.getTime() ?? Number.POSITIVE_INFINITY
    const bd = parseActivityDate(b.dueAt)?.getTime() ?? Number.POSITIVE_INFINITY
    return ad - bd || a.title.localeCompare(b.title, "pt-BR")
  }), [activities, filter, query])

  return (
    <DashboardPage title="Atividades" description="Encontre rapidamente o que precisa fazer, revisar ou consultar." toolbar={<><SearchField value={query} onChange={setQuery} placeholder="Buscar atividade..." className="relative min-w-0 flex-1 sm:max-w-sm" /><SegmentedControl value={filter} onChange={setFilter} ariaLabel="Filtrar atividades" options={[{ value: "pending", label: "Pendentes", count: counts.pending }, { value: "in_progress", label: "Em andamento", count: counts.in_progress }, { value: "revision", label: "Revisão", count: counts.revision }, { value: "completed", label: "Concluídas", count: counts.completed }]} /></>}>
      {!isFirebaseReady ? <DashboardNotice>Firebase não configurado. Conecte para visualizar suas atividades reais.</DashboardNotice> : null}
      {error ? <DashboardNotice tone="danger">{error}</DashboardNotice> : null}
      {loading ? <div className="space-y-2">{[0,1,2,3].map((item) => <div key={item} className="h-20 animate-pulse rounded-xl bg-muted" />)}</div> : filtered.length === 0 ? <DashboardEmptyState icon={ClipboardCheck} title="Nada por aqui" description={query ? "Nenhuma atividade corresponde à busca e ao filtro atuais." : "Não há atividades neste estado no momento."} /> : <div className="space-y-2">{filtered.map((activity) => <StudentActivityCard key={activity.id} activity={activity} onOpen={(id) => router.push(`/dashboard/activities/${id}`)} />)}</div>}
    </DashboardPage>
  )
}
