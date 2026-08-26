"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, CalendarDays, CheckCircle2, GraduationCap, ListChecks, RotateCcw } from "lucide-react"

import { DashboardEmptyState, DashboardNotice } from "@/components/dashboard/dashboard-feedback"
import { DashboardPage } from "@/components/dashboard/dashboard-page"
import { DashboardStatCard } from "@/components/dashboard/dashboard-stat-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/hooks/use-auth"
import { parseActivityDate } from "@/lib/activities/deadlines"
import { toFriendlyFirestoreLoadError } from "@/lib/firebase/error-message"
import { fetchUserActivityProgressList, fetchUserDashboard } from "@/lib/firebase/firestore"
import type { ActivityProgress, DashboardCourse } from "@/lib/firebase/types"
import { calculateDashboardProgressPercent } from "@/lib/metrics/learning-progress"
import { StudentActivityCard } from "@/modules/activities/ui/student-activity-card"
import { StudentCourseCard } from "@/modules/courses/ui/student-course-card"

export default function Page() {
  const router = useRouter()
  const { user, profile, isFirebaseReady } = useAuth()
  const [courses, setCourses] = React.useState<DashboardCourse[]>([])
  const [progress, setProgress] = React.useState<ActivityProgress[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    async function load() {
      if (!user || !isFirebaseReady) { setCourses([]); setProgress([]); setLoading(false); return }
      try { setLoading(true); setError(null); const [dashboard, activityProgress] = await Promise.all([fetchUserDashboard(user.uid), fetchUserActivityProgressList(user.uid)]); setCourses(dashboard); setProgress(activityProgress) }
      catch (loadError) { setError(toFriendlyFirestoreLoadError(loadError, "Não foi possível carregar sua visão geral.")) }
      finally { setLoading(false) }
    }
    void load()
  }, [isFirebaseReady, user])

  const progressById = React.useMemo(() => new Map(progress.map((item) => [item.activityId, item] as const)), [progress])
  const activities = React.useMemo(() => courses.flatMap((course) => course.activities.map((activity) => ({ ...activity, courseTitle: course.title, trackTitle: course.tracks.find((track) => track.id === activity.trackId)?.title ?? "", progress: progressById.get(activity.id) ?? null }))), [courses, progressById])
  const pending = React.useMemo(() => activities.filter((item) => item.progress?.status !== "completed" || item.progress?.gradingStatus === "revision_requested").sort((a, b) => { const ad = parseActivityDate(a.dueAt)?.getTime() ?? Number.POSITIVE_INFINITY; const bd = parseActivityDate(b.dueAt)?.getTime() ?? Number.POSITIVE_INFINITY; return ad - bd || a.order - b.order }), [activities])
  const next = pending[0]
  const stats = { progress: calculateDashboardProgressPercent(courses, progress), courses: courses.length, pending: pending.length, revisions: progress.filter((item) => item.gradingStatus === "revision_requested").length }
  const displayName = profile?.name?.split(" ")[0] || user?.displayName?.split(" ")[0] || ""

  return (
    <DashboardPage title={displayName ? `Olá, ${displayName}` : "Visão geral"} description="Veja o que precisa da sua atenção e continue seus estudos.">
      {!isFirebaseReady ? <DashboardNotice>Firebase não configurado. Os dados reais da conta não estão disponíveis.</DashboardNotice> : null}
      {error ? <DashboardNotice tone="danger">{error}</DashboardNotice> : null}

      {loading ? <div className="h-44 animate-pulse rounded-2xl bg-muted" /> : next ? (
        <Card className="overflow-hidden border-primary/15 bg-card py-0">
          <CardContent className="grid gap-5 p-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div><p className="text-xs font-medium text-primary">CONTINUE DE ONDE PAROU</p><h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">{next.title}</h2><p className="mt-1 text-sm text-muted-foreground">{next.courseTitle}{next.trackTitle ? ` · ${next.trackTitle}` : ""}</p>{next.progress?.gradingStatus === "revision_requested" ? <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-amber-600 dark:text-amber-400"><RotateCcw className="size-4" />O professor solicitou uma revisão desta entrega.</p> : null}</div>
            <Button size="lg" onClick={() => router.push(`/dashboard/activities/${next.id}`)}>Continuar <ArrowRight className="size-4" /></Button>
          </CardContent>
        </Card>
      ) : <DashboardEmptyState icon={CheckCircle2} title="Tudo em dia" description="Você não possui atividades pendentes neste momento." action={<Button asChild variant="outline"><Link href="/dashboard/courses">Ver meus cursos</Link></Button>} />}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard title="Progresso geral" value={`${stats.progress}%`} icon={ListChecks} />
        <DashboardStatCard title="Cursos" value={stats.courses} icon={GraduationCap} />
        <DashboardStatCard title="Atividades pendentes" value={stats.pending} icon={CalendarDays} />
        <DashboardStatCard title="Revisões" value={stats.revisions} icon={RotateCcw} />
      </div>

      <section className="space-y-3"><div className="flex items-end justify-between gap-3"><div><h2 className="text-lg font-semibold">Próximas atividades</h2><p className="text-sm text-muted-foreground">Ordenadas pelos prazos mais próximos.</p></div><Button asChild variant="ghost" size="sm"><Link href="/dashboard/activities">Ver todas <ArrowRight className="size-3.5" /></Link></Button></div><div className="space-y-2">{pending.slice(0, 4).map((activity) => <StudentActivityCard key={activity.id} variant="compact" activity={{ ...activity, status: activity.progress?.status === "completed" ? "completed" : activity.progress?.status === "in_progress" ? "in_progress" : "pending", gradingStatus: activity.progress?.gradingStatus }} onOpen={(id) => router.push(`/dashboard/activities/${id}`)} />)}{!loading && pending.length === 0 ? <p className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">Nenhuma atividade pendente.</p> : null}</div></section>

      <section className="space-y-3"><div className="flex items-end justify-between gap-3"><div><h2 className="text-lg font-semibold">Meus cursos</h2><p className="text-sm text-muted-foreground">Acesse o conteúdo organizado por módulos.</p></div><Button asChild variant="ghost" size="sm"><Link href="/dashboard/courses">Ver todos <ArrowRight className="size-3.5" /></Link></Button></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{courses.slice(0, 3).map((course) => <StudentCourseCard key={course.id} course={course} />)}</div></section>
    </DashboardPage>
  )
}
