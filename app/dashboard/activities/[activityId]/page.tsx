"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  FileText,
  Link2,
  Loader2,
  Save,
  Send,
  Target,
} from "lucide-react"
import { toast } from "sonner"

import { DashboardHeader } from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/hooks/use-auth"
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

type QuestionModel = NonNullable<Activity["questions"]>[number]
type AnswerState = Record<string, ActivityAnswerValue>

function normalizeText(value: string) {
  return value.trim().toLowerCase()
}

function getQuestionKey(question: QuestionModel, index: number) {
  return question.id || `q-${index}`
}

function isAnswered(value: ActivityAnswerValue) {
  if (Array.isArray(value)) {
    return value.length > 0
  }
  if (typeof value === "boolean") {
    return true
  }
  if (typeof value === "string") {
    return value.trim().length > 0
  }
  return false
}

function compareAsSet(left: string[], right: string[]) {
  if (left.length !== right.length) return false
  const leftSet = new Set(left.map(normalizeText))
  const rightSet = new Set(right.map(normalizeText))
  if (leftSet.size !== rightSet.size) return false
  return Array.from(leftSet).every((item) => rightSet.has(item))
}

function evaluateQuestion(question: QuestionModel, answer: ActivityAnswerValue) {
  const expected = Array.isArray(question.correctAnswers)
    ? question.correctAnswers.filter((item) => typeof item === "string")
    : []
  if (expected.length === 0) {
    return null
  }

  if (question.type === "multiple_choice") {
    const selected = Array.isArray(answer)
      ? answer.filter((item): item is string => typeof item === "string")
      : []
    return compareAsSet(selected, expected)
  }

  if (question.type === "single_choice" || question.type === "true_false") {
    const selected =
      typeof answer === "string"
        ? answer
        : typeof answer === "boolean"
          ? answer
            ? "true"
            : "false"
          : ""
    return normalizeText(selected) === normalizeText(expected[0] ?? "")
  }

  return null
}

function statusLabel(progress: ActivityProgress | null, isCompleted: boolean) {
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
      const key = getQuestionKey(question, index)
      return count + (isAnswered(answers[key] ?? null) ? 1 : 0)
    }, 0)
    const completionPercent =
      totalQuestions === 0 ? 100 : Math.round((answeredCount / totalQuestions) * 100)

    const evaluable = questions
      .map((question, index) => {
        const key = getQuestionKey(question, index)
        const result = evaluateQuestion(question, answers[key] ?? null)
        return result
      })
      .filter((result): result is boolean => result !== null)
    const correctCount = evaluable.filter(Boolean).length
    const scorePercent =
      evaluable.length > 0 ? Math.round((correctCount / evaluable.length) * 100) : null

    return {
      totalQuestions,
      answeredCount,
      completionPercent,
      scorePercent,
      canSubmit: answeredCount === totalQuestions,
    }
  }, [answers, questions])

  const isCompleted = progress?.status === "completed"

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
    setIsSaving(true)
    try {
      await persistProgress(isCompleted ? "completed" : "in_progress")
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
    if (!progressStats.canSubmit) {
      toast.error("Responda todas as questões antes de finalizar.")
      return
    }

    setIsSubmitting(true)
    try {
      await persistProgress("completed")
      toast.success("Atividade finalizada com sucesso.")
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
    setAnswers((prev) => ({ ...prev, [questionKey]: value }))
  }

  function toggleMultiChoice(questionKey: string, option: string) {
    setAnswers((prev) => {
      const current = Array.isArray(prev[questionKey]) ? [...prev[questionKey]] : []
      const index = current.findIndex((item) => normalizeText(item) === normalizeText(option))
      if (index >= 0) {
        current.splice(index, 1)
      } else {
        current.push(option)
      }
      return { ...prev, [questionKey]: current }
    })
  }

  return (
    <div>
      <DashboardHeader
        title="Atividade"
        description="Resolva as questões, salve seu progresso e finalize quando terminar."
      />

      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-center justify-between gap-3">
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/dashboard/activities">
              <ArrowLeft className="mr-2 size-4" />
              Voltar para atividades
            </Link>
          </Button>
          {activity ? (
            <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary">
              {statusLabel(progress, isCompleted)}
            </span>
          ) : null}
        </div>

        {isLoading ? (
          <div className="rounded-2xl border border-dashed bg-accent/40 p-6 text-sm text-muted-foreground animate-pulse">
            Carregando atividade...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-dashed border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : !activity ? (
          <div className="rounded-2xl border border-dashed bg-accent/40 p-6 text-sm text-muted-foreground">
            Atividade não encontrada ou sem permissão de acesso.
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="space-y-5">
              <Card className="border-primary/20 bg-card/70">
                <CardHeader className="gap-3">
                  <CardTitle className="text-xl leading-tight">{activity.title}</CardTitle>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="rounded-full border border-primary/10 bg-primary/5 px-3 py-1 uppercase tracking-widest font-semibold">
                      {activity.courseTitle}
                    </span>
                    {activity.trackTitle ? (
                      <span className="rounded-full border border-primary/10 bg-primary/5 px-3 py-1 uppercase tracking-widest font-semibold">
                        {activity.trackTitle}
                      </span>
                    ) : null}
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/10 bg-primary/5 px-3 py-1 uppercase tracking-widest font-semibold">
                      <Clock3 className="size-3.5 text-primary" />
                      {activity.estimatedMinutes || 15} min
                    </span>
                  </div>
                </CardHeader>
                {activity.attachments?.length ? (
                  <CardContent className="space-y-3 pt-0">
                    <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      Materiais de apoio
                    </h3>
                    <div className="grid gap-2">
                      {activity.attachments.map((attachment, index) => (
                        <a
                          key={`${attachment.url}-${index}`}
                          href={attachment.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 rounded-xl border border-primary/10 bg-background/80 px-3 py-2 text-sm hover:border-primary/30 transition-colors"
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
                        const questionKey = getQuestionKey(question, index)
                        const value = answers[questionKey] ?? null
                        const options = question.options ?? []
                        return (
                          <li
                            key={questionKey}
                            className="rounded-2xl border border-primary/10 bg-card/40 p-4"
                          >
                            <div className="mb-3 flex items-start justify-between gap-2">
                              <p className="text-sm font-semibold leading-relaxed">
                                {index + 1}. {question.prompt}
                              </p>
                              <span className="shrink-0 rounded-full border border-primary/15 px-2 py-0.5 text-[10px] uppercase tracking-widest text-primary">
                                {question.type}
                              </span>
                            </div>

                            {(question.type === "essay" || question.type === "short_answer") && (
                              <textarea
                                value={typeof value === "string" ? value : ""}
                                onChange={(event) =>
                                  updateSingleAnswer(questionKey, event.target.value)
                                }
                                rows={question.type === "essay" ? 6 : 3}
                                className="w-full rounded-xl border border-primary/15 bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary"
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
                                      className="flex cursor-pointer items-center gap-2 rounded-xl border border-primary/10 bg-background/70 px-3 py-2 text-sm hover:border-primary/25"
                                    >
                                      <input
                                        id={optionId}
                                        type="radio"
                                        name={questionKey}
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
                                      (item) => normalizeText(item) === normalizeText(option)
                                    )
                                    : false
                                  const optionId = `${questionKey}-multi-${optionIndex}`
                                  return (
                                    <label
                                      key={optionId}
                                      htmlFor={optionId}
                                      className="flex cursor-pointer items-center gap-2 rounded-xl border border-primary/10 bg-background/70 px-3 py-2 text-sm hover:border-primary/25"
                                    >
                                      <input
                                        id={optionId}
                                        type="checkbox"
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
                                      className="flex cursor-pointer items-center gap-2 rounded-xl border border-primary/10 bg-background/70 px-3 py-2 text-sm hover:border-primary/25"
                                    >
                                      <input
                                        id={optionId}
                                        type="radio"
                                        name={questionKey}
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

            <div className="space-y-4 lg:sticky lg:top-4 lg:self-start">
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="text-base">Resumo da entrega</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-widest text-muted-foreground">
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
                      <span className="text-muted-foreground">Pontuação</span>
                      <span className="font-semibold">
                        {progressStats.scorePercent === null
                          ? "Sem correção automática"
                          : `${progressStats.scorePercent}%`}
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-full"
                      onClick={() => void handleSaveDraft()}
                      disabled={isSaving || isSubmitting}
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
                      className="rounded-full"
                      onClick={() => void handleSubmit()}
                      disabled={
                        isSubmitting ||
                        isSaving ||
                        !progressStats.canSubmit ||
                        (questions.length === 0 && isCompleted)
                      }
                    >
                      {isSubmitting ? (
                        <Loader2 className="mr-2 size-4 animate-spin" />
                      ) : (
                        <Send className="mr-2 size-4" />
                      )}
                      {isCompleted ? "Atualizar envio" : "Finalizar atividade"}
                    </Button>
                  </div>

                  {!progressStats.canSubmit && questions.length > 0 ? (
                    <p className="text-xs text-muted-foreground">
                      Você precisa responder todas as questões para finalizar.
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
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
