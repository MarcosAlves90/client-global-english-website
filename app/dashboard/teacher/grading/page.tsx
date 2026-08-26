"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight, ClipboardPenLine, Clock3, RotateCcw, UserRound } from "lucide-react"
import { toast } from "sonner"

import { ActivityAnswerValueView } from "@/components/activities/activity-answer-value"
import { DashboardNotice } from "@/components/dashboard/dashboard-feedback"
import { DashboardPage } from "@/components/dashboard/dashboard-page"
import { DashboardStatCard } from "@/components/dashboard/dashboard-stat-card"
import { SearchField } from "@/components/dashboard/search-field"
import { SegmentedControl } from "@/components/dashboard/segmented-control"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect } from "@/components/ui/native-select"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/hooks/use-auth"
import {
  validateTeacherGradeDraft,
  validateTeacherRevisionRequest,
} from "@/lib/activities/grading"
import type { AdminActivityResponse, AdminCourseSummary } from "@/lib/firebase/types"
import {
  fetchTeacherActivityProgress,
  gradeTeacherActivityProgress,
  requestTeacherActivityRevision,
} from "@/modules/activities"
import { clearTeacherGradebookCache, fetchTeacherCourses } from "@/modules/courses"
import {
  filterTeacherSubmissions,
  paginateTeacherSubmissions,
  type ReviewStatusFilter,
  type SubmissionDateFilter,
  type SubmissionSort,
} from "@/modules/courses/model/grading-submissions"


function formatDate(value: Date | string | null) {
  if (!value) return "Sem data"
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return "Sem data"
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date)
}


export default function Page() {
  const { role, user, isFirebaseReady } = useAuth()
  const [courses, setCourses] = React.useState<AdminCourseSummary[]>([])
  const [courseId, setCourseId] = React.useState("")
  const [submissions, setSubmissions] = React.useState<AdminActivityResponse[]>([])
  const [selectedId, setSelectedId] = React.useState("")
  const [filter, setFilter] = React.useState<ReviewStatusFilter>("pending")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [activityFilter, setActivityFilter] = React.useState("all")
  const [dateFilter, setDateFilter] = React.useState<SubmissionDateFilter>("all")
  const [sort, setSort] = React.useState<SubmissionSort>("newest")
  const [page, setPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(10)
  const [score, setScore] = React.useState("")
  const [feedback, setFeedback] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
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

  const loadSubmissions = React.useCallback(
    async (force = false) => {
      if (!user || !courseId) {
        setSubmissions([])
        return
      }
      try {
        setLoading(true)
        setError(null)
        const items = await fetchTeacherActivityProgress({
          idToken: await user.getIdToken(),
          courseId,
          force,
        })
        const reviewable = items.filter(
          (item) => item.status === "completed" || item.gradingStatus === "revision_requested"
        )
        setSubmissions(reviewable)
        setSelectedId((current) =>
          reviewable.some((item) => item.id === current) ? current : reviewable[0]?.id || ""
        )
      } catch {
        setError("Não foi possível carregar as entregas deste curso.")
      } finally {
        setLoading(false)
      }
    },
    [courseId, user]
  )

  React.useEffect(() => {
    void loadSubmissions()
  }, [loadSubmissions])

  const pendingCount = submissions.filter(
    (item) => item.status === "completed" && item.gradingStatus === "pending"
  ).length
  const revisionCount = submissions.filter(
    (item) => item.gradingStatus === "revision_requested"
  ).length
  const gradedCount = submissions.filter((item) => item.gradingStatus === "graded").length
  const activityOptions = React.useMemo(() => {
    const byId = new Map<string, string>()
    submissions.forEach((item) => {
      if (item.activity?.id && item.activity.title) {
        byId.set(item.activity.id, item.activity.title)
      }
    })
    return [...byId.entries()]
      .map(([id, title]) => ({ id, title }))
      .sort((a, b) => a.title.localeCompare(b.title, "pt-BR", { sensitivity: "base" }))
  }, [submissions])

  const filtered = React.useMemo(
    () =>
      filterTeacherSubmissions(submissions, {
        status: filter,
        searchQuery,
        activityId: activityFilter,
        dateRange: dateFilter,
        sort,
      }),
    [activityFilter, dateFilter, filter, searchQuery, sort, submissions]
  )

  const paginated = React.useMemo(
    () => paginateTeacherSubmissions(filtered, page, pageSize),
    [filtered, page, pageSize]
  )

  const effectiveSelectedId = paginated.items.some((item) => item.id === selectedId)
    ? selectedId
    : paginated.items[0]?.id ?? ""
  const selected = paginated.items.find((item) => item.id === effectiveSelectedId) ?? null

  React.useEffect(() => {
    setScore(
      selected?.gradingStatus === "graded" &&
        selected.teacherScorePercent !== null &&
        selected.teacherScorePercent !== undefined
        ? String(selected.teacherScorePercent)
        : ""
    )
    setFeedback(selected?.teacherFeedback ?? "")
  }, [selected])

  async function handleSaveGrade() {
    if (!user || !selected || selected.status !== "completed") return
    const validation = validateTeacherGradeDraft({
      scorePercent: Number(score),
      feedback,
    })
    if (!validation.ok) {
      toast.error(validation.message)
      return
    }

    try {
      setSaving(true)
      await gradeTeacherActivityProgress({
        idToken: await user.getIdToken(),
        id: selected.id,
        scorePercent: validation.value.scorePercent,
        feedback: validation.value.feedback,
      })
      clearTeacherGradebookCache()
      toast.success("Correção salva.")
      await loadSubmissions(true)
    } catch {
      toast.error("Não foi possível salvar a correção.")
    } finally {
      setSaving(false)
    }
  }

  async function handleRequestRevision() {
    if (!user || !selected || selected.status !== "completed") return
    const validation = validateTeacherRevisionRequest({ feedback })
    if (!validation.ok) {
      toast.error(validation.message)
      return
    }

    try {
      setSaving(true)
      await requestTeacherActivityRevision({
        idToken: await user.getIdToken(),
        id: selected.id,
        feedback: validation.value.feedback,
      })
      clearTeacherGradebookCache()
      setFilter("revision_requested")
      setPage(1)
      toast.success("Revisão solicitada. A entrega foi reaberta para o aluno.")
      await loadSubmissions(true)
    } catch {
      toast.error("Não foi possível solicitar a revisão.")
    } finally {
      setSaving(false)
    }
  }

  if (role !== "teacher" && role !== "admin") {
    return (
      <DashboardPage title="Correções" description="Avaliação de entregas dos alunos.">
        <DashboardNotice tone="danger">Acesso exclusivo para professores e administradores.</DashboardNotice>
      </DashboardPage>
    )
  }

  return (
    <DashboardPage
      title="Correções"
      description="Avalie entregas e solicite revisões somente nos cursos atribuídos à sua conta."
      contentClassName="gap-6"
    >
      <div>
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard/teacher">
            <ArrowLeft className="mr-2 size-4" />
            Área do professor
          </Link>
        </Button>
      </div>

      {error ? <DashboardNotice tone="danger">{error}</DashboardNotice> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard title="Entregas" value={submissions.length} icon={ClipboardPenLine} loading={loading} />
        <DashboardStatCard title="Aguardando correção" value={pendingCount} icon={Clock3} loading={loading} />
        <DashboardStatCard title="Revisões abertas" value={revisionCount} icon={RotateCcw} loading={loading} />
        <DashboardStatCard title="Corrigidas" value={gradedCount} icon={CheckCircle2} loading={loading} />
      </div>

      <div className="space-y-3">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(240px,0.7fr)]">
          <div className="grid gap-3 sm:grid-cols-2">
            <NativeSelect
              aria-label="Selecionar curso para correção"
              value={courseId}
              onChange={(event) => { setCourseId(event.target.value); setActivityFilter("all"); setPage(1) }}
            >
              {courses.length === 0 ? <option value="">Nenhum curso atribuído</option> : null}
              {courses.map((course) => (
                <option key={course.id} value={course.id}>{course.title}</option>
              ))}
            </NativeSelect>
            <SearchField
              value={searchQuery}
              onChange={(value) => { setSearchQuery(value); setPage(1) }}
              ariaLabel="Buscar entrega"
              placeholder="Buscar aluno ou atividade..."
            />
          </div>
          <SegmentedControl
            ariaLabel="Estado da correção"
            value={filter}
            onChange={(value) => { setFilter(value); setPage(1) }}
            options={[
              { value: "pending", label: "Pendentes", count: pendingCount },
              { value: "revision_requested", label: "Revisões", count: revisionCount },
              { value: "graded", label: "Corrigidas", count: gradedCount },
            ]}
            className="justify-self-start lg:justify-self-end"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <NativeSelect
            aria-label="Filtrar por atividade"
            value={activityFilter}
            onChange={(event) => { setActivityFilter(event.target.value); setPage(1) }}
          >
            <option value="all">Todas as atividades</option>
            {activityOptions.map((activity) => (
              <option key={activity.id} value={activity.id}>{activity.title}</option>
            ))}
          </NativeSelect>
          <NativeSelect
            aria-label="Filtrar por período de envio"
            value={dateFilter}
            onChange={(event) => { setDateFilter(event.target.value as SubmissionDateFilter); setPage(1) }}
          >
            <option value="all">Qualquer período</option>
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
          </NativeSelect>
          <NativeSelect
            aria-label="Ordenar entregas"
            value={sort}
            onChange={(event) => { setSort(event.target.value as SubmissionSort); setPage(1) }}
          >
            <option value="newest">Mais recentes primeiro</option>
            <option value="oldest">Mais antigas primeiro</option>
            <option value="student">Aluno (A–Z)</option>
            <option value="activity">Atividade (A–Z)</option>
          </NativeSelect>
          <NativeSelect
            aria-label="Entregas por página"
            value={String(pageSize)}
            onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1) }}
          >
            <option value="10">10 por página</option>
            <option value="25">25 por página</option>
            <option value="50">50 por página</option>
          </NativeSelect>
        </div>
      </div>

      <div role="group" aria-label="Entregas e avaliação" className="grid items-start gap-5 lg:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Entregas do curso</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {paginated.items.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma entrega encontrada com os filtros atuais.</p>
            ) : (
              paginated.items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={`w-full rounded-2xl border p-3 text-left transition-colors ${effectiveSelectedId === item.id ? "border-primary/35 bg-primary/7" : "border-border bg-card hover:bg-muted/60"}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{item.activity?.title || "Atividade"}</p>
                      <p className="truncate text-xs text-muted-foreground">{item.user?.name || item.user?.email || item.userId}</p>
                    </div>
                    <span className="ge-chip shrink-0">
                      {item.gradingStatus === "graded"
                        ? "Corrigida"
                        : item.gradingStatus === "revision_requested"
                          ? "Em revisão"
                          : "Pendente"}
                    </span>
                  </div>
                </button>
              ))
            )}

            <div className="flex flex-col gap-2 border-t border-border/70 pt-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                {paginated.totalItems === 0
                  ? "0 entregas"
                  : `${paginated.from}–${paginated.to} de ${paginated.totalItems} entregas`}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.max(1, paginated.page - 1))}
                  disabled={paginated.page <= 1}
                  aria-label="Página anterior"
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <span className="min-w-20 text-center text-xs font-medium text-muted-foreground">
                  Página {paginated.page} de {paginated.totalPages}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.min(paginated.totalPages, paginated.page + 1))}
                  disabled={paginated.page >= paginated.totalPages}
                  aria-label="Próxima página"
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Avaliação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {!selected ? (
              <p className="text-sm text-muted-foreground">Selecione uma entrega para corrigir.</p>
            ) : (
              <>
                <div className="ge-surface-muted space-y-1 p-4">
                  <p className="flex items-center gap-2 text-sm font-semibold">
                    <UserRound className="size-4 text-primary" />
                    {selected.user?.name || selected.user?.email || selected.userId}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selected.activity?.title || "Atividade"} · enviada em {formatDate(selected.submittedAt)}
                  </p>
                  {selected.scorePercent !== null ? (
                    <p className="text-xs text-muted-foreground">Referência automática: {selected.scorePercent}%</p>
                  ) : null}
                </div>

                <div className="space-y-3">
                  {(selected.activity?.questions ?? []).map((question, index) => {
                    const key = question.id || `q-${index}`
                    return (
                      <div key={key} className="ge-inset space-y-2 p-4">
                        <p className="text-sm font-semibold">{index + 1}. {question.prompt}</p>
                        {question.promptAudio?.url ? (
                          <div>
                            <p className="mb-1 text-xs text-muted-foreground">Áudio de referência</p>
                            <audio controls preload="metadata" src={question.promptAudio.url} className="h-9 max-w-full" />
                          </div>
                        ) : null}
                        <ActivityAnswerValueView
                          questionType={question.type}
                          value={selected.answers[key]}
                          className="whitespace-pre-wrap text-sm text-muted-foreground"
                        />
                      </div>
                    )
                  })}
                </div>

                {selected.gradingStatus === "revision_requested" ? (
                  <DashboardNotice>
                    O aluno está revisando esta entrega. Ela voltará para Pendentes quando for reenviada.
                  </DashboardNotice>
                ) : (
                  <>
                    <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
                      <div className="space-y-2">
                        <Label htmlFor="teacher-score">Nota (%)</Label>
                        <Input id="teacher-score" type="number" min={0} max={100} step="0.01" value={score} onChange={(event) => setScore(event.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="teacher-feedback">Feedback</Label>
                        <Textarea id="teacher-feedback" value={feedback} maxLength={4000} onChange={(event) => setFeedback(event.target.value)} rows={5} placeholder="Explique os principais acertos ou o que precisa ser revisado." />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button onClick={() => void handleSaveGrade()} disabled={saving || score.trim() === ""}>
                        {saving ? "Salvando..." : selected.gradingStatus === "graded" ? "Atualizar correção" : "Salvar correção"}
                      </Button>
                      <Button variant="outline" onClick={() => void handleRequestRevision()} disabled={saving || feedback.trim() === ""}>
                        <RotateCcw className="mr-2 size-4" />
                        Solicitar revisão
                      </Button>
                    </div>
                  </>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardPage>
  )
}
