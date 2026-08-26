"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, BookOpen, CheckCircle2, Clock, FileText, PlayCircle } from "lucide-react"

import { DashboardEmptyState, DashboardNotice } from "@/components/dashboard/dashboard-feedback"
import { DashboardPage } from "@/components/dashboard/dashboard-page"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/hooks/use-auth"
import { fetchUserActivityProgressList, fetchUserDashboard } from "@/lib/firebase/firestore"
import type { ActivityProgress, DashboardCourse } from "@/lib/firebase/types"

export default function CourseDetailPage() {
  const params = useParams<{ courseId: string }>()
  const router = useRouter()
  const { user, isFirebaseReady } = useAuth()
  const [course, setCourse] = React.useState<DashboardCourse | null>(null)
  const [progress, setProgress] = React.useState<ActivityProgress[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    async function load() {
      if (!user || !isFirebaseReady) { setLoading(false); return }
      try { setLoading(true); setError(null); const [courses, progressItems] = await Promise.all([fetchUserDashboard(user.uid), fetchUserActivityProgressList(user.uid)]); setCourse(courses.find((item) => item.id === params.courseId) ?? null); setProgress(progressItems) }
      catch { setError("Não foi possível carregar este curso.") }
      finally { setLoading(false) }
    }
    void load()
  }, [isFirebaseReady, params.courseId, user])

  const progressById = React.useMemo(() => new Map(progress.map((item) => [item.activityId, item] as const)), [progress])
  const completion = course ? Math.round((course.activities.filter((activity) => progressById.get(activity.id)?.status === "completed").length / Math.max(course.activities.length, 1)) * 100) : 0

  return (
    <DashboardPage title={course?.title ?? "Curso"} description={course ? `${course.level} · ${course.durationWeeks} semanas` : "Conteúdo do curso"} breadcrumbItems={[{ label: "Cursos", href: "/dashboard/courses" }, { label: course?.title ?? "Curso" }]} action={<Button asChild variant="ghost" size="sm"><Link href="/dashboard/courses"><ArrowLeft className="size-4" />Cursos</Link></Button>}>
      {error ? <DashboardNotice tone="danger">{error}</DashboardNotice> : null}
      {loading ? <div className="h-48 animate-pulse rounded-2xl bg-muted" /> : !course ? <DashboardEmptyState icon={BookOpen} title="Curso indisponível" description="Este curso não está disponível para sua conta ou não foi encontrado." /> : <>
        <Card className="py-0"><CardContent className="grid gap-5 p-6 sm:grid-cols-[1fr_auto] sm:items-center"><div><p className="max-w-2xl text-sm leading-6 text-muted-foreground">{course.description}</p><div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground"><span>{course.tracks.length} módulos</span><span>{course.activities.length} atividades</span></div></div><div className="min-w-36"><div className="flex items-center justify-between text-xs"><span className="text-muted-foreground">Progresso</span><span className="font-semibold">{completion}%</span></div><div className="mt-2 h-2 rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${completion}%` }} /></div></div></CardContent></Card>
        <section className="space-y-4"><div><h2 className="text-lg font-semibold">Conteúdo</h2><p className="text-sm text-muted-foreground">Siga os módulos e retome de onde parou.</p></div>{course.tracks.map((track) => { const activities = course.activities.filter((activity) => activity.trackId === track.id).sort((a,b) => a.order-b.order); return <Card key={track.id} className="py-0"><CardContent className="p-0"><div className="border-b border-border px-5 py-4"><h3 className="font-semibold">{track.title}</h3>{track.description ? <p className="mt-1 text-sm text-muted-foreground">{track.description}</p> : null}</div><div className="divide-y divide-border">{activities.length === 0 ? <p className="px-5 py-4 text-sm text-muted-foreground">Nenhuma atividade liberada neste módulo.</p> : activities.map((activity) => { const item = progressById.get(activity.id); const completed = item?.status === "completed"; return <button key={activity.id} type="button" onClick={() => router.push(`/dashboard/activities/${activity.id}`)} className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-muted/45"><div className={completed ? "flex size-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600" : "ge-icon-tile size-8"}>{completed ? <CheckCircle2 className="size-4" /> : activity.type === "lesson" ? <PlayCircle className="size-4" /> : <FileText className="size-4" />}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{activity.title}</p><p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground"><Clock className="size-3" />{activity.estimatedMinutes ? `${activity.estimatedMinutes} min` : "Sem estimativa"}</p></div><span className="text-xs font-medium text-muted-foreground">{item?.gradingStatus === "revision_requested" ? "Revisão" : completed ? "Concluída" : item?.status === "in_progress" ? "Em andamento" : "Começar"}</span></button> })}</div></CardContent></Card>})}</section>
      </>}
    </DashboardPage>
  )
}
