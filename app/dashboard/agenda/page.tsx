"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, CalendarDays, Clock3 } from "lucide-react"

import { DashboardEmptyState, DashboardNotice } from "@/components/dashboard/dashboard-feedback"
import { DashboardPage } from "@/components/dashboard/dashboard-page"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/hooks/use-auth"
import { getActivityTiming, parseActivityDate } from "@/lib/activities/deadlines"
import { toFriendlyFirestoreLoadError } from "@/lib/firebase/error-message"
import { fetchUserActivities, fetchUserActivityProgressList, fetchUserDashboard } from "@/lib/firebase/firestore"

type AgendaActivity = { id: string; title: string; courseTitle: string; trackTitle: string; type: string; dueAt?: Date | string | null; status: "pending" | "completed" | "in_progress" }

function dayKey(date: Date) { return new Intl.DateTimeFormat("pt-BR", { year: "numeric", month: "2-digit", day: "2-digit" }).format(date) }
function dayLabel(date: Date, now: Date) { const today = dayKey(now); const tomorrow = dayKey(new Date(now.getTime() + 86400000)); const key = dayKey(date); if (key === today) return "Hoje"; if (key === tomorrow) return "Amanhã"; return new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long" }).format(date) }

export default function Page() {
  const router = useRouter()
  const { user, isFirebaseReady } = useAuth()
  const [activities, setActivities] = React.useState<AgendaActivity[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    async function load() {
      if (!user || !isFirebaseReady) return
      try { setLoading(true); setError(null); const [dashboard, items, progress] = await Promise.all([fetchUserDashboard(user.uid), fetchUserActivities(user.uid), fetchUserActivityProgressList(user.uid)]); const courseById = new Map(dashboard.map((course) => [course.id, course.title] as const)); const trackById = new Map(dashboard.flatMap((course) => course.tracks.map((track) => [track.id, track.title] as const))); const progressById = new Map(progress.map((item) => [item.activityId, item.status] as const)); setActivities(items.map<AgendaActivity>((activity) => ({ id: activity.id, title: activity.title, courseTitle: courseById.get(activity.courseId) ?? "Curso", trackTitle: trackById.get(activity.trackId) ?? "", type: activity.type, dueAt: activity.dueAt, status: progressById.get(activity.id) === "completed" ? "completed" : progressById.get(activity.id) === "in_progress" ? "in_progress" : "pending" })).sort((a,b) => (parseActivityDate(a.dueAt)?.getTime() ?? Number.MAX_SAFE_INTEGER) - (parseActivityDate(b.dueAt)?.getTime() ?? Number.MAX_SAFE_INTEGER))) }
      catch (loadError) { setError(toFriendlyFirestoreLoadError(loadError, "Não foi possível carregar sua agenda.")) }
      finally { setLoading(false) }
    }
    void load()
  }, [isFirebaseReady, user])

  const now = React.useMemo(() => new Date(), [])
  const overdue = activities.filter((item) => item.status !== "completed" && getActivityTiming(item, now).isOverdue)
  const scheduled = activities.filter((item) => item.status !== "completed" && parseActivityDate(item.dueAt) && !getActivityTiming(item, now).isOverdue)
  const withoutDeadline = activities.filter((item) => item.status !== "completed" && !parseActivityDate(item.dueAt))
  const groups = scheduled.reduce<Map<string, { date: Date; items: AgendaActivity[] }>>((map, item) => { const date = parseActivityDate(item.dueAt)!; const key = dayKey(date); const existing = map.get(key); if (existing) existing.items.push(item); else map.set(key, { date, items: [item] }); return map }, new Map())

  const row = (item: AgendaActivity, overdueItem = false) => { const date = parseActivityDate(item.dueAt); return <button key={item.id} type="button" onClick={() => router.push(`/dashboard/activities/${item.id}`)} className="flex w-full items-center gap-4 px-5 py-3 text-left transition-colors hover:bg-muted/45"><div className="w-14 shrink-0 text-xs font-medium text-muted-foreground">{date ? new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(date) : "—"}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{item.title}</p><p className="truncate text-xs text-muted-foreground">{item.courseTitle}{item.trackTitle ? ` · ${item.trackTitle}` : ""}</p></div><span className={overdueItem ? "inline-flex items-center gap-1 text-xs font-medium text-destructive" : "text-xs text-muted-foreground"}>{overdueItem ? <><AlertTriangle className="size-3.5" />Atrasada</> : item.status === "in_progress" ? "Em andamento" : "Pendente"}</span></button> }

  return <DashboardPage title="Agenda" description="Prazos em ordem cronológica para você planejar a semana.">
    {!isFirebaseReady ? <DashboardNotice>Firebase não configurado. A agenda depende dos dados reais da plataforma.</DashboardNotice> : null}
    {error ? <DashboardNotice tone="danger">{error}</DashboardNotice> : null}
    {loading ? <div className="h-48 animate-pulse rounded-2xl bg-muted" /> : activities.length === 0 ? <DashboardEmptyState icon={CalendarDays} title="Agenda vazia" description="Nenhuma atividade está disponível para sua conta." /> : <div className="space-y-5">
      {overdue.length ? <section><div className="mb-2 flex items-center gap-2"><AlertTriangle className="size-4 text-destructive" /><h2 className="font-semibold">Atrasadas</h2></div><Card className="overflow-hidden py-0"><CardContent className="divide-y divide-border p-0">{overdue.map((item) => row(item, true))}</CardContent></Card></section> : null}
      {Array.from(groups.values()).map((group) => <section key={dayKey(group.date)}><div className="mb-2"><h2 className="font-semibold capitalize">{dayLabel(group.date, now)}</h2><p className="text-xs text-muted-foreground">{new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(group.date)}</p></div><Card className="overflow-hidden py-0"><CardContent className="divide-y divide-border p-0">{group.items.map((item) => row(item))}</CardContent></Card></section>)}
      {withoutDeadline.length ? <section><div className="mb-2 flex items-center gap-2"><Clock3 className="size-4 text-muted-foreground" /><h2 className="font-semibold">Sem prazo definido</h2></div><Card className="overflow-hidden py-0"><CardContent className="divide-y divide-border p-0">{withoutDeadline.map((item) => row(item))}</CardContent></Card></section> : null}
    </div>}
  </DashboardPage>
}
