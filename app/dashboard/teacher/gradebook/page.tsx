"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowLeft, CheckCircle2, ClipboardCheck, RotateCcw, Users2 } from "lucide-react"

import { DashboardNotice } from "@/components/dashboard/dashboard-feedback"
import { DashboardPage } from "@/components/dashboard/dashboard-page"
import { DashboardStatCard } from "@/components/dashboard/dashboard-stat-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { NativeSelect } from "@/components/ui/native-select"
import { useAuth } from "@/hooks/use-auth"
import {
  calculateFinalGradeAverage,
  getGradebookEntryState,
} from "@/lib/activities/grading"
import type { AdminCourseSummary, TeacherGradebook } from "@/lib/firebase/types"
import {
  buildGradebookProgressMap,
  summarizeTeacherGradebook,
} from "@/modules/courses/model/gradebook"
import { fetchTeacherCourses, fetchTeacherGradebook } from "@/modules/courses"

const stateLabels = {
  not_started: "—",
  in_progress: "Em andamento",
  pending_review: "Aguardando",
  revision_requested: "Revisão",
  graded: "Corrigida",
} as const

export default function Page() {
  const { role, user, isFirebaseReady } = useAuth()
  const [courses, setCourses] = React.useState<AdminCourseSummary[]>([])
  const [courseId, setCourseId] = React.useState("")
  const [gradebook, setGradebook] = React.useState<TeacherGradebook | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    async function loadCourses() {
      if (!user || !isFirebaseReady || (role !== "teacher" && role !== "admin")) return
      try {
        setLoading(true)
        const items = await fetchTeacherCourses(await user.getIdToken())
        setCourses(items)
        setCourseId((current) => current || items[0]?.id || "")
      } catch {
        setError("Não foi possível carregar seus cursos docentes.")
      } finally {
        setLoading(false)
      }
    }
    void loadCourses()
  }, [isFirebaseReady, role, user])

  const loadGradebook = React.useCallback(
    async (force = false) => {
      if (!user || !courseId) {
        setGradebook(null)
        return
      }
      try {
        setLoading(true)
        setError(null)
        setGradebook(
          await fetchTeacherGradebook({
            idToken: await user.getIdToken(),
            courseId,
            force,
          })
        )
      } catch {
        setError("Não foi possível carregar o Gradebook deste curso.")
      } finally {
        setLoading(false)
      }
    },
    [courseId, user]
  )

  React.useEffect(() => {
    void loadGradebook()
  }, [loadGradebook])

  if (role !== "teacher" && role !== "admin") {
    return (
      <DashboardPage title="Gradebook" description="Notas consolidadas por curso.">
        <DashboardNotice tone="danger">Acesso exclusivo para professores e administradores.</DashboardNotice>
      </DashboardPage>
    )
  }

  const progressMap = buildGradebookProgressMap(gradebook?.progress ?? [])
  const summary = summarizeTeacherGradebook(gradebook?.progress ?? [])

  return (
    <DashboardPage
      title="Gradebook"
      description="Acompanhe notas finais, entregas pendentes e revisões dos cursos atribuídos."
      contentClassName="gap-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard/teacher">
            <ArrowLeft className="mr-2 size-4" />
            Área do professor
          </Link>
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/teacher/grading">Abrir correções</Link>
          </Button>
          <Button variant="outline" size="sm" onClick={() => void loadGradebook(true)} disabled={loading || !courseId}>
            Atualizar
          </Button>
        </div>
      </div>

      {error ? <DashboardNotice tone="danger">{error}</DashboardNotice> : null}

      <Card>
        <CardContent className="p-5">
          <div className="max-w-xl space-y-2">
            <Label htmlFor="gradebook-course">Curso</Label>
            <NativeSelect
              id="gradebook-course"
              value={courseId}
              onChange={(event) => setCourseId(event.target.value)}
            >
              {courses.length === 0 ? <option value="">Nenhum curso atribuído</option> : null}
              {courses.map((course) => (
                <option key={course.id} value={course.id}>{course.title}</option>
              ))}
            </NativeSelect>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard title="Alunos" value={gradebook?.students.length ?? 0} icon={Users2} loading={loading} />
        <DashboardStatCard title="Aguardando correção" value={summary.awaitingReviewCount} icon={ClipboardCheck} loading={loading} />
        <DashboardStatCard title="Revisões abertas" value={summary.revisionRequestedCount} icon={RotateCcw} loading={loading} />
        <DashboardStatCard title="Corrigidas" value={summary.gradedCount} icon={CheckCircle2} loading={loading} />
      </div>

      {!loading && gradebook && gradebook.students.length === 0 ? (
        <DashboardNotice>Nenhum aluno está vinculado a este curso.</DashboardNotice>
      ) : null}

      {gradebook && gradebook.students.length > 0 ? (
        <Card className="hidden overflow-hidden md:flex">
          <CardContent className="overflow-x-auto p-0">
            <table className="min-w-225 w-full border-collapse text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left">
                  <th className="sticky left-0 z-10 min-w-56 bg-muted/90 p-3 font-semibold">Aluno</th>
                  {gradebook.activities.map((activity) => (
                    <th key={activity.id} className="min-w-40 p-3 align-bottom font-semibold">
                      <span className="block">{activity.title}</span>
                      <span className="mt-1 block text-xs font-normal text-muted-foreground">
                        {activity.trackTitle || "Curso"}
                      </span>
                    </th>
                  ))}
                  <th className="min-w-28 p-3 font-semibold">Média final</th>
                </tr>
              </thead>
              <tbody>
                {gradebook.students.map((student) => {
                  const studentProgress = gradebook.progress.filter((item) => item.userId === student.uid)
                  const average = calculateFinalGradeAverage(studentProgress)
                  return (
                    <tr key={student.uid} className="border-b last:border-b-0">
                      <td className="sticky left-0 z-10 bg-background p-3">
                        <p className="font-semibold">{student.name || student.email || student.uid}</p>
                        {student.email ? <p className="text-xs text-muted-foreground">{student.email}</p> : null}
                      </td>
                      {gradebook.activities.map((activity) => {
                        const item = progressMap.get(`${student.uid}:${activity.id}`) ?? null
                        const state = getGradebookEntryState(item)
                        return (
                          <td key={activity.id} className="p-3 align-top">
                            {state === "graded" && typeof item?.teacherScorePercent === "number" ? (
                              <div>
                                <p className="font-semibold text-emerald-600">{item.teacherScorePercent}%</p>
                                <p className="text-xs text-muted-foreground">{stateLabels[state]}</p>
                              </div>
                            ) : (
                              <div>
                                <p className="font-medium">{stateLabels[state]}</p>
                                {state === "pending_review" && typeof item?.automaticScorePercent === "number" ? (
                                  <p className="text-xs text-muted-foreground">Auto: {item.automaticScorePercent}%</p>
                                ) : null}
                              </div>
                            )}
                          </td>
                        )
                      })}
                      <td className="p-3 font-semibold">{average === null ? "—" : `${average}%`}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ) : null}

      {gradebook && gradebook.students.length > 0 ? (
        <div className="space-y-3 md:hidden">
          {gradebook.students.map((student) => {
            const studentProgress = gradebook.progress.filter((item) => item.userId === student.uid)
            const average = calculateFinalGradeAverage(studentProgress)
            return (
              <Card key={student.uid} className="py-0">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0"><p className="truncate font-semibold">{student.name || student.email || student.uid}</p>{student.email ? <p className="truncate text-xs text-muted-foreground">{student.email}</p> : null}</div>
                    <div className="text-right"><p className="text-xs text-muted-foreground">Média</p><p className="text-lg font-semibold">{average === null ? "—" : `${average}%`}</p></div>
                  </div>
                  <div className="mt-4 divide-y divide-border rounded-xl border border-border">
                    {gradebook.activities.map((activity) => {
                      const item = progressMap.get(`${student.uid}:${activity.id}`) ?? null
                      const state = getGradebookEntryState(item)
                      return <div key={activity.id} className="flex items-center justify-between gap-3 px-3 py-2.5"><div className="min-w-0"><p className="truncate text-sm font-medium">{activity.title}</p><p className="text-xs text-muted-foreground">{stateLabels[state]}</p></div><span className="shrink-0 text-sm font-semibold">{state === "graded" && typeof item?.teacherScorePercent === "number" ? `${item.teacherScorePercent}%` : "—"}</span></div>
                    })}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : null}
    </DashboardPage>
  )
}
