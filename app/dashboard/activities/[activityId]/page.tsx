"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import {
  AlertTriangle,
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileText,
  Link2,
  Loader2,
  Save,
  Send,
  Target,
  MessageSquareText,
} from "lucide-react"
import { toast } from "sonner"

import { AudioAnswerField } from "@/components/activities/audio-answer-field"
import { DashboardNotice } from "@/components/dashboard/dashboard-feedback"
import { DashboardPage } from "@/components/dashboard/dashboard-page"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/hooks/use-auth"
import { getActivityTiming, parseActivityDate } from "@/lib/activities/deadlines"
import { ACTIVITY_QUESTION_TYPE_LABELS } from "@/lib/activities/questions"
import { getEffectiveScore } from "@/lib/activities/grading"
import {
  calculateAutomaticActivityScore,
  getActivityQuestionKey,
  isActivityAnswerPresent,
} from "@/lib/activities/scoring"
import { toFriendlyFirestoreLoadError } from "@/lib/firebase/error-message"
import {
  fetchUserActivities,
  fetchUserActivityProgress,
  fetchUserDashboard,
  upsertUserActivityProgress,
} from "@/lib/firebase/firestore"
import type {
  Activity,
  ActivityAnswerValue,
  ActivityProgress,
} from "@/lib/firebase/types"

type ActivityDetail = Activity & {
  courseTitle: string
  trackTitle: string
}

type AnswerState = Record<string, ActivityAnswerValue>

function statusLabel(progress: ActivityProgress | null, isCompleted: boolean) {
  if (progress?.gradingStatus === "revision_requested") {
    return "Revisão solicitada"
  }
  if (isCompleted || progress?.status === "completed") {
    return "Concluída"
  }
  if (progress?.status === "in_progress") {
    return "Em andamento"
  }
  return "Pendente"
}

export default function Page() {
  const router = useRouter()
  const params = useParams<{ activityId: string }>()
  const { user, loading, isFirebaseReady } = useAuth()

  const [activity, setActivity] = React.useState<ActivityDetail | null>(null)
  const [progress, setProgress] = React.useState<ActivityProgress | null>(null)
  const [answers, setAnswers] = React.useState<AnswerState>({})
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!loading && !user && isFirebaseReady) {
      router.push("/login")
    }
  }, [loading, user, router, isFirebaseReady])

  React.useEffect(() => {
    async function loadActivity() {
      if (!user || !isFirebaseReady) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        setError(null)
        const [dashboard, activities, progressData] = await Promise.all([
          fetchUserDashboard(user.uid),
          fetchUserActivities(user.uid),
          fetchUserActivityProgress(user.uid, params.activityId),
        ])

        const trackById = new Map(
          dashboard.flatMap((course) =>
            course.tracks.map((track) => [track.id, track.title] as const)
          )
        )
        const courseById = new Map(
          dashboard.map((course) => [course.id, course.title] as const)
        )

        const match = activities.find((item) => item.id === params.activityId)
        if (!match) {
          setActivity(null)
          setProgress(null)
          setAnswers({})
          return
        }

        setActivity({
          ...match,
          courseTitle: courseById.get(match.courseId) ?? "Curso",
          trackTitle: trackById.get(match.trackId) ?? "",
        })
        setProgress(progressData)
        setAnswers(progressData?.answers ?? {})
      } catch (fetchError) {
        setError(
          toFriendlyFirestoreLoadError(
            fetchError,
            "Não foi possível carregar esta atividade."
          )
        )
      } finally {
        setIsLoading(false)
      }
    }

    void loadActivity()
  }, [user, isFirebaseReady, params.activityId])

  const questions = React.useMemo(
    () => activity?.questions ?? [],
    [activity?.questions]
  )

  const progressStats = React.useMemo(() => {
    const totalQuestions = questions.length
    const answeredCount = questions.reduce((count, question, index) => {
      const key = getActivityQuestionKey(question, index)
      return count + (isActivityAnswerPresent(answers[key] ?? null) ? 1 : 0)
    }, 0)
    const completionPercent =
      totalQuestions === 0 ? 100 : Math.round((answeredCount / totalQuestions) * 100)

    const { scorePercent } = calculateAutomaticActivityScore(questions, answers)

    return {
      totalQuestions,
      answeredCount,
      completionPercent,
      scorePercent,
      canSubmit: answeredCount === totalQuestions,
    }
  }, [answers, questions])

  const isCompleted = progress?.status === "completed"
  const revisionRequested = progress?.gradingStatus === "revision_requested"
  const timing = activity ? getActivityTiming(activity) : { dueAt: null, closeAt: null, isOverdue: false, isClosed: false }
  const submissionClosed = timing.isClosed && !isCompleted && !revisionRequested
  const effectiveScore = getEffectiveScore({
    gradingStatus: progress?.gradingStatus,
    teacherScorePercent: progress?.teacherScorePercent,
    scorePercent: progressStats.scorePercent,
  })

  async function persistProgress(status: "in_progress" | "completed") {
    if (!user || !activity) return

    const normalizedAnswers: AnswerState = {}
    for (const [key, value] of Object.entries(answers)) {
      if (Array.isArray(value)) {
        normalizedAnswers[key] = value.filter((item) => Boolean(item))
      } else if (typeof value === "string") {
        normalizedAnswers[key] = value.trim()
      } else {
        normalizedAnswers[key] = value
      }
    }

    await upsertUserActivityProgress({
      uid: user.uid,
      activityId: activity.id,
      courseId: activity.courseId,
      trackId: activity.trackId,
      status,
      answers: normalizedAnswers,
      answeredCount: progressStats.answeredCount,
      totalQuestions: progressStats.totalQuestions,
      completionPercent: progressStats.completionPercent,
      scorePercent: progressStats.scorePercent,
      markSubmitted: status === "completed",
    })

    const next = await fetchUserActivityProgress(user.uid, activity.id)
    setProgress(next)
  }

  async function handleSaveDraft() {
    if (!activity) return
    if (isCompleted) {
      toast.error("Esta atividade já foi enviada e não pode ser alterada.")
      return
    }
    if (submissionClosed) {
      toast.error("O período de envio desta atividade foi encerrado.")
      return
    }
    setIsSaving(true)
    try {
      await persistProgress("in_progress")
      toast.success("Rascunho salvo.")
    } catch (saveError) {
      toast.error(
        toFriendlyFirestoreLoadError(
          saveError,
          "Não foi possível salvar suas respostas."
        )
      )
    } finally {
      setIsSaving(false)
    }
  }

  async function handleSubmit() {
    if (!activity) return
    if (isCompleted) {
      toast.error("Esta atividade já foi enviada e não pode ser alterada.")
      return
    }
    if (submissionClosed) {
      toast.error("O período de envio desta atividade foi encerrado.")
      return
    }
    if (!progressStats.canSubmit) {
      toast.error("Responda todas as questões antes de finalizar.")
      return
    }

    setIsSubmitting(true)
    try {
      await persistProgress("completed")
      toast.success(
        revisionRequested
          ? "Atividade reenviada para nova correção."
          : "Atividade finalizada com sucesso."
      )
    } catch (submitError) {
      toast.error(
        toFriendlyFirestoreLoadError(
          submitError,
          "Não foi possível finalizar a atividade."
        )
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  function updateSingleAnswer(questionKey: string, value: ActivityAnswerValue) {
    if (isCompleted || submissionClosed) {
      return
    }
    setAnswers((prev) => ({ ...prev, [questionKey]: value }))
  }

  function toggleMultiChoice(questionKey: string, option: string) {
    if (isCompleted || submissionClosed) {
      return
    }
    setAnswers((prev) => {
      const current = Array.isArray(prev[questionKey]) ? [...prev[questionKey]] : []
      const index = current.findIndex((item) => item.trim().toLowerCase() === option.trim().toLowerCase())
      if (index >= 0) {
        current.splice(index, 1)
      } else {
        current.push(option)
      }
      return { ...prev, [questionKey]: current }
    })
  }

  return (
    <DashboardPage
      title={activity?.title ?? "Atividade"}
      description={
        activity
          ? [activity.courseTitle, activity.trackTitle].filter(Boolean).join(" · ")
          : "Resolva as questões, salve seu progresso e finalize quando terminar."
      }
      breadcrumbItems={[
        { label: "Atividades", href: "/dashboard/activities" },
        { label: activity?.title ?? "Atividade" },
      ]}
      action={
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard/activities">
            <ArrowLeft className="mr-2 size-4" />
            Atividades
          </Link>
        </Button>
      }
      toolbar={
        activity ? (
          <>
            <span className="ge-chip text-foreground">{statusLabel(progress, isCompleted)}</span>
            {activity.estimatedMinutes > 0 ? (
              <span className="ge-chip"><Clock3 className="size-3.5" />{activity.estimatedMinutes} min</span>
            ) : null}
            {parseActivityDate(activity.dueAt) ? (
              <span className={!isCompleted && timing.isOverdue ? "ge-chip text-destructive" : "ge-chip"}>
                {!isCompleted && timing.isOverdue ? <AlertTriangle className="size-3.5" /> : <CalendarClock className="size-3.5" />}
                Entrega {parseActivityDate(activity.dueAt)?.toLocaleString("pt-BR")}
              </span>
            ) : null}
          </>
        ) : null
      }
      contentClassName="gap-6"
    >

        {isLoading ? (
          <DashboardNotice className="animate-pulse">
            Carregando atividade...
          </DashboardNotice>
        ) : error ? (
          <DashboardNotice tone="danger">{error}</DashboardNotice>
        ) : !activity ? (
          <DashboardNotice>
            Atividade não encontrada ou sem permissão de acesso.
          </DashboardNotice>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="space-y-5">
              <Card>
                <CardHeader className="gap-3">
                  <CardTitle className="text-base">Detalhes da atividade</CardTitle>
                  <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                    <div><span className="font-medium text-foreground">Curso</span><p>{activity.courseTitle}</p></div>
                    <div><span className="font-medium text-foreground">Módulo</span><p>{activity.trackTitle || "Sem módulo"}</p></div>
                  </div>
                </CardHeader>
                {activity.attachments?.length ? (
                  <CardContent className="space-y-3 pt-0">
                    <h3 className="text-sm font-medium text-foreground">
                      Materiais de apoio
                    </h3>
                    <div className="grid gap-2">
                      {activity.attachments.map((attachment, index) => (
                        <div
                          key={`${attachment.url}-${index}`}
                          className="ge-inset flex flex-col gap-2 px-3 py-2 text-sm"
                        >
                          <a
                            href={attachment.url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 transition-colors hover:text-primary"
                          >
                            {attachment.type === "link" ? (
                              <Link2 className="size-4 text-primary" />
                            ) : (
                              <FileText className="size-4 text-primary" />
                            )}
                            <span className="line-clamp-1">
                              {attachment.name || "Abrir material"}
                            </span>
                          </a>
                          {attachment.type === "audio" ? (
                            <audio controls preload="metadata" src={attachment.url} className="h-9 max-w-full" />
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                ) : null}
              </Card>

                  {questions.length === 0 ? (
                    <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                      <Target className="size-4" />
                      Esta atividade não possui questões cadastradas.
                    </div>
                  ) : (
                    <ol className="space-y-4">
                      {questions.map((question, index) => {
                        const questionKey = getActivityQuestionKey(question, index)
                        const value = answers[questionKey] ?? null
                        const options = question.options ?? []
                        return (
                          <li
                            key={questionKey}
                            className="ge-surface p-4"
                          >
                            <div className="mb-3 flex items-start justify-between gap-2">
                              <p className="text-sm font-semibold leading-relaxed">
                                {index + 1}. {question.prompt}
                              </p>
                              <span className="ge-chip shrink-0">
                                {ACTIVITY_QUESTION_TYPE_LABELS[question.type]}
                              </span>
                            </div>

                            {question.promptAudio?.url ? (
                              <div className="mb-3 ge-inset p-3">
                                <p className="mb-2 text-xs font-medium text-muted-foreground">Áudio de referência</p>
                                <audio controls preload="metadata" src={question.promptAudio.url} className="h-9 max-w-full" />
                              </div>
                            ) : null}

                            {question.type === "audio_response" ? (
                              <AudioAnswerField
                                value={typeof value === "string" ? value : ""}
                                disabled={isCompleted || submissionClosed}
                                onChange={(audioUrl) => updateSingleAnswer(questionKey, audioUrl)}
                              />
                            ) : null}

                            {(question.type === "essay" || question.type === "short_answer") && (
                              <Textarea
                                value={typeof value === "string" ? value : ""}
                                disabled={isCompleted || submissionClosed}
                                onChange={(event) =>
                                  updateSingleAnswer(questionKey, event.target.value)
                                }
                                rows={question.type === "essay" ? 6 : 3}
                                placeholder="Digite sua resposta..."
                              />
                            )}

                            {question.type === "single_choice" && (
                              <div className="grid gap-2">
                                {options.map((option, optionIndex) => {
                                  const optionId = `${questionKey}-option-${optionIndex}`
                                  return (
                                    <label
                                      key={optionId}
                                      htmlFor={optionId}
                                      className="ge-inset flex cursor-pointer items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-muted/70"
                                    >
                                      <input
                                        id={optionId}
                                        type="radio"
                                        name={questionKey}
                                        disabled={isCompleted || submissionClosed}
                                        checked={value === option}
                                        onChange={() => updateSingleAnswer(questionKey, option)}
                                        className="size-4 accent-primary"
                                      />
                                      <span>{option}</span>
                                    </label>
                                  )
                                })}
                              </div>
                            )}

                            {question.type === "multiple_choice" && (
                              <div className="grid gap-2">
                                {options.map((option, optionIndex) => {
                                  const selected = Array.isArray(value)
                                    ? value.some(
                                      (item) => item.trim().toLowerCase() === option.trim().toLowerCase()
                                    )
                                    : false
                                  const optionId = `${questionKey}-multi-${optionIndex}`
                                  return (
                                    <label
                                      key={optionId}
                                      htmlFor={optionId}
                                      className="ge-inset flex cursor-pointer items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-muted/70"
                                    >
                                      <input
                                        id={optionId}
                                        type="checkbox"
                                        disabled={isCompleted || submissionClosed}
                                        checked={selected}
                                        onChange={() => toggleMultiChoice(questionKey, option)}
                                        className="size-4 accent-primary"
                                      />
                                      <span>{option}</span>
                                    </label>
                                  )
                                })}
                              </div>
                            )}

                            {question.type === "true_false" && (
                              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                {[
                                  { label: "Verdadeiro", value: "true" },
                                  { label: "Falso", value: "false" },
                                ].map((option) => {
                                  const optionId = `${questionKey}-${option.value}`
                                  return (
                                    <label
                                      key={optionId}
                                      htmlFor={optionId}
                                      className="ge-inset flex cursor-pointer items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-muted/70"
                                    >
                                      <input
                                        id={optionId}
                                        type="radio"
                                        name={questionKey}
                                        disabled={isCompleted || submissionClosed}
                                        checked={value === option.value}
                                        onChange={() =>
                                          updateSingleAnswer(questionKey, option.value)
                                        }
                                        className="size-4 accent-primary"
                                      />
                                      <span>{option.label}</span>
                                    </label>
                                  )
                                })}
                              </div>
                            )}
                          </li>
                        )
                      })}
                    </ol>
                  )}
            </div>

            <div className="space-y-4 lg:sticky lg:top-36 lg:self-start">
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-base">Resumo da entrega</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="mb-2 flex items-center justify-between text-xs font-medium text-muted-foreground">
                      <span>Progresso</span>
                      <span>{progressStats.completionPercent}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-primary/10">
                      <div
                        className="h-2 rounded-full bg-primary transition-all"
                        style={{ width: `${progressStats.completionPercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid gap-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Respondidas</span>
                      <span className="font-semibold">
                        {progressStats.answeredCount}/{progressStats.totalQuestions}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Status</span>
                      <span className="font-semibold">
                        {statusLabel(progress, isCompleted)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{effectiveScore.source === "teacher" ? "Nota do professor" : "Pontuação automática"}</span>
                      <span className="font-semibold">
                        {effectiveScore.scorePercent === null
                          ? "Aguardando correção"
                          : `${effectiveScore.scorePercent}%`}
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => void handleSaveDraft()}
                      disabled={isSaving || isSubmitting || isCompleted || submissionClosed}
                    >
                      {isSaving ? (
                        <Loader2 className="mr-2 size-4 animate-spin" />
                      ) : (
                        <Save className="mr-2 size-4" />
                      )}
                      Salvar rascunho
                    </Button>

                    <Button
                      type="button"
                      onClick={() => void handleSubmit()}
                      disabled={
                        isSubmitting ||
                        isSaving ||
                        isCompleted ||
                        submissionClosed ||
                        !progressStats.canSubmit ||
                        (questions.length === 0 && isCompleted)
                      }
                    >
                      {isSubmitting ? (
                        <Loader2 className="mr-2 size-4 animate-spin" />
                      ) : (
                        <Send className="mr-2 size-4" />
                      )}
                      {isCompleted
                        ? "Atividade enviada"
                        : revisionRequested
                          ? "Reenviar atividade"
                          : "Finalizar atividade"}
                    </Button>
                  </div>

                  {!progressStats.canSubmit && questions.length > 0 ? (
                    <p className="text-xs text-muted-foreground">
                      Você precisa responder todas as questões para finalizar.
                    </p>
                  ) : null}

                  {submissionClosed ? (
                    <p className="inline-flex items-center gap-2 text-xs font-semibold text-destructive">
                      <AlertTriangle className="size-4" />
                      O período de envio foi encerrado.
                    </p>
                  ) : !isCompleted && timing.isOverdue ? (
                    <p className="inline-flex items-center gap-2 text-xs font-semibold text-amber-600">
                      <AlertTriangle className="size-4" />
                      O prazo normal passou, mas a atividade ainda aceita envio.
                    </p>
                  ) : null}

                  {isCompleted ? (
                    <p className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-600">
                      <CheckCircle2 className="size-4" />
                      Atividade concluída e contabilizada.
                    </p>
                  ) : null}
                </CardContent>
              </Card>

              {progress?.gradingStatus === "graded" ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <MessageSquareText className="size-4 text-primary" />
                      Feedback do professor
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                      {progress.teacherFeedback || "Correção concluída sem comentário adicional."}
                    </p>
                    {progress.gradedAt ? (
                      <p className="text-xs text-muted-foreground">
                        Corrigida em {progress.gradedAt.toLocaleString("pt-BR")}
                      </p>
                    ) : null}
                  </CardContent>
                </Card>
              ) : revisionRequested ? (
                <Card className="border-amber-500/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <MessageSquareText className="size-4 text-amber-600" />
                      Revisão solicitada
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                      {progress.teacherFeedback || "Revise sua entrega antes de reenviar."}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Você pode editar e reenviar esta atividade mesmo que o prazo normal já tenha encerrado.
                    </p>
                  </CardContent>
                </Card>
              ) : isCompleted ? (
                <>
                  {progress?.teacherFeedback ? (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                          <MessageSquareText className="size-4 text-primary" />
                          Feedback da revisão anterior
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                          {progress.teacherFeedback}
                        </p>
                      </CardContent>
                    </Card>
                  ) : null}
                  <DashboardNotice>Entrega enviada. A correção do professor ainda está pendente.</DashboardNotice>
                </>
              ) : null}
            </div>
          </div>
        )}
    </DashboardPage>
  )
}
