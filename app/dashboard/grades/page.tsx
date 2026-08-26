"use client"

import * as React from "react"
import Link from "next/link"
import { CheckCircle2, ClipboardCheck, MessageSquareText, RotateCcw } from "lucide-react"

import { DashboardNotice } from "@/components/dashboard/dashboard-feedback"
import { DashboardPage } from "@/components/dashboard/dashboard-page"
import { SegmentedControl } from "@/components/dashboard/segmented-control"
import { DashboardStatCard } from "@/components/dashboard/dashboard-stat-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/hooks/use-auth"
import { calculateFinalGradeAverage, getEffectiveScore, getGradebookEntryState } from "@/lib/activities/grading"
import { calculateAutomaticActivityScore } from "@/lib/activities/scoring"
import { toFriendlyFirestoreLoadError } from "@/lib/firebase/error-message"
import { fetchUserActivityProgressList, fetchUserDashboard } from "@/lib/firebase/firestore"
import type { ActivityProgress, DashboardCourse } from "@/lib/firebase/types"

type GradeFilter = "all" | "graded" | "pending" | "revision"

export default function Page() {
  const { user, isFirebaseReady } = useAuth()
  const [courses, setCourses] = React.useState<DashboardCourse[]>([])
  const [progress, setProgress] = React.useState<ActivityProgress[]>([])
  const [filter, setFilter] = React.useState<GradeFilter>("all")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => { async function load() { if (!user || !isFirebaseReady) return; try { setLoading(true); setError(null); const [dashboard, items] = await Promise.all([fetchUserDashboard(user.uid), fetchUserActivityProgressList(user.uid)]); setCourses(dashboard); setProgress(items) } catch (loadError) { setError(toFriendlyFirestoreLoadError(loadError, "Não foi possível carregar suas notas e feedbacks.")) } finally { setLoading(false) } } void load() }, [isFirebaseReady, user])

  const visibleActivityIds = React.useMemo(() => new Set(courses.flatMap((course) => course.activities.map((activity) => activity.id))), [courses])
  const visibleProgress = progress.filter((item) => visibleActivityIds.has(item.activityId))
  const counts = { graded: visibleProgress.filter((item) => item.gradingStatus === "graded").length, pending: visibleProgress.filter((item) => item.status === "completed" && item.gradingStatus === "pending").length, revision: visibleProgress.filter((item) => item.gradingStatus === "revision_requested").length }
  const finalAverage = calculateFinalGradeAverage(visibleProgress)
  const progressById = new Map(progress.map((item) => [item.activityId, item] as const))

  return <DashboardPage title="Notas & Feedback" description="Priorize correções finais e revisões que pedem uma nova ação." toolbar={<SegmentedControl value={filter} onChange={setFilter} ariaLabel="Filtrar notas" options={[{ value: "all", label: "Todas" }, { value: "graded", label: "Corrigidas", count: counts.graded }, { value: "pending", label: "Aguardando", count: counts.pending }, { value: "revision", label: "Revisão", count: counts.revision }]} />}>
    {error ? <DashboardNotice tone="danger">{error}</DashboardNotice> : null}
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><DashboardStatCard title="Média final" value={finalAverage === null ? "—" : `${finalAverage}%`} icon={MessageSquareText} loading={loading} /><DashboardStatCard title="Corrigidas" value={counts.graded} icon={CheckCircle2} loading={loading} /><DashboardStatCard title="Aguardando" value={counts.pending} icon={ClipboardCheck} loading={loading} /><DashboardStatCard title="Revisões" value={counts.revision} icon={RotateCcw} loading={loading} /></div>
    <div className="space-y-5">{courses.map((course) => { const items = course.activities.filter((activity) => { const item = progressById.get(activity.id); const state = getGradebookEntryState(item ?? null); return filter === "all" || (filter === "graded" && state === "graded") || (filter === "pending" && state === "pending_review") || (filter === "revision" && state === "revision_requested") }); if (items.length === 0) return null; return <section key={course.id} className="space-y-2"><div><h2 className="font-semibold">{course.title}</h2><p className="text-xs text-muted-foreground">{items.length} atividade{items.length === 1 ? "" : "s"}</p></div><Card className="overflow-hidden py-0"><CardContent className="divide-y divide-border p-0">{items.map((activity) => { const item = progressById.get(activity.id) ?? null; const state = getGradebookEntryState(item); const automatic = item ? calculateAutomaticActivityScore(activity.questions ?? [], item.answers).scorePercent : null; const effective = getEffectiveScore({ gradingStatus: item?.gradingStatus, teacherScorePercent: item?.teacherScorePercent, scorePercent: automatic }); return <div key={activity.id} className="grid gap-3 px-5 py-4 sm:grid-cols-[1fr_auto] sm:items-start"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-medium">{activity.title}</p><span className={state === "graded" ? "text-xs font-medium text-emerald-600" : state === "revision_requested" ? "text-xs font-medium text-amber-600" : "text-xs text-muted-foreground"}>{state === "graded" ? "Corrigida" : state === "revision_requested" ? "Revisão solicitada" : state === "pending_review" ? "Aguardando correção" : state === "in_progress" ? "Em andamento" : "Não iniciada"}</span></div>{item?.teacherFeedback ? <div className="mt-2 rounded-xl bg-muted/55 p-3"><p className="text-xs font-medium text-muted-foreground">Feedback do professor</p><p className="mt-1 whitespace-pre-wrap text-sm leading-5">{item.teacherFeedback}</p></div> : null}{state === "revision_requested" ? <Button asChild size="sm" className="mt-3"><Link href={`/dashboard/activities/${activity.id}`}>Revisar atividade</Link></Button> : null}</div><div className="min-w-24 text-left sm:text-right">{state === "graded" && effective.scorePercent !== null ? <><p className="text-2xl font-semibold tracking-[-0.03em]">{effective.scorePercent}%</p>{automatic !== null ? <p className="text-xs text-muted-foreground">Auto: {automatic}%</p> : null}</> : automatic !== null && item?.status === "completed" ? <><p className="text-sm font-medium">{automatic}%</p><p className="text-xs text-muted-foreground">Referência automática</p></> : <p className="text-sm text-muted-foreground">—</p>}</div></div>})}</CardContent></Card></section> })}</div>
  </DashboardPage>
}
