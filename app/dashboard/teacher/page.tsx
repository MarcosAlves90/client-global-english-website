"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowRight, BookOpenCheck, ClipboardList, ClipboardPenLine, Users2 } from "lucide-react"

import { DashboardNotice } from "@/components/dashboard/dashboard-feedback"
import { DashboardPage } from "@/components/dashboard/dashboard-page"
import { DashboardStatCard } from "@/components/dashboard/dashboard-stat-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/hooks/use-auth"
import type { AdminCourseSummary } from "@/lib/firebase/types"
import { fetchTeacherCourses } from "@/modules/courses"

export default function Page() {
  const { role, user, isFirebaseReady } = useAuth()
  const [courses, setCourses] = React.useState<AdminCourseSummary[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => { async function load() { if (!user || !isFirebaseReady || (role !== "teacher" && role !== "admin")) { setCourses([]); return } try { setLoading(true); setError(null); setCourses(await fetchTeacherCourses(await user.getIdToken())) } catch { setError("Não foi possível carregar seus cursos docentes.") } finally { setLoading(false) } } void load() }, [isFirebaseReady, role, user])

  if (role !== "teacher" && role !== "admin") return <DashboardPage title="Professor" description="Área docente da plataforma."><DashboardNotice tone="danger">Acesso exclusivo para professores e administradores.</DashboardNotice></DashboardPage>

  const students = courses.reduce((sum, course) => sum + course.studentsCount, 0)
  const activities = courses.reduce((sum, course) => sum + course.activitiesCount, 0)

  return <DashboardPage title="Professor" description="Acesse correções primeiro e use seus cursos como contexto de trabalho." action={<Button asChild size="sm"><Link href="/dashboard/teacher/grading">Abrir correções <ArrowRight className="size-3.5" /></Link></Button>}>
    {error ? <DashboardNotice tone="danger">{error}</DashboardNotice> : null}
    <Card className="border-primary/15 py-0"><CardContent className="grid gap-5 p-6 sm:grid-cols-[1fr_auto] sm:items-center"><div><p className="text-xs font-medium text-primary">PRÓXIMA AÇÃO</p><h2 className="mt-2 text-xl font-semibold">Corrigir entregas dos alunos</h2><p className="mt-1 text-sm text-muted-foreground">Revise respostas, dê uma nota final ou solicite uma nova versão.</p></div><div className="flex gap-2"><Button asChild><Link href="/dashboard/teacher/grading"><ClipboardPenLine className="size-4" />Correções</Link></Button><Button asChild variant="outline"><Link href="/dashboard/teacher/gradebook"><ClipboardList className="size-4" />Gradebook</Link></Button></div></CardContent></Card>
    <div className="grid gap-3 sm:grid-cols-3"><DashboardStatCard title="Cursos atribuídos" value={courses.length} icon={BookOpenCheck} loading={loading} /><DashboardStatCard title="Vínculos de alunos" value={students} icon={Users2} loading={loading} /><DashboardStatCard title="Atividades" value={activities} icon={ClipboardList} loading={loading} /></div>
    <section className="space-y-3"><div><h2 className="text-lg font-semibold">Meus cursos</h2><p className="text-sm text-muted-foreground">Contexto dos cursos atribuídos à sua conta.</p></div>{loading ? <div className="h-32 animate-pulse rounded-2xl bg-muted" /> : courses.length === 0 ? <DashboardNotice>Nenhum curso foi atribuído a esta conta de professor.</DashboardNotice> : <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{courses.map((course) => <Card key={course.id} className="py-0"><CardContent className="p-5"><div className="flex items-start gap-3"><div className="ge-icon-tile size-10 shrink-0"><BookOpenCheck className="size-4.5" /></div><div className="min-w-0"><h3 className="font-semibold">{course.title}</h3><p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{course.description}</p><p className="mt-3 text-xs text-muted-foreground">{course.modulesCount} módulos · {course.activitiesCount} atividades · {course.studentsCount} alunos</p></div></div><Button asChild variant="outline" size="sm" className="mt-4 w-full"><Link href={`/dashboard/teacher/courses/${course.id}`}>Abrir curso <ArrowRight className="size-3.5" /></Link></Button></CardContent></Card>)}</div>}</section>
  </DashboardPage>
}
