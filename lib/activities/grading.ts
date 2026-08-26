export type TeacherGradeDraft = {
  scorePercent: number
  feedback: string
}

export type TeacherGradeValidation =
  | { ok: true; value: TeacherGradeDraft }
  | { ok: false; message: string }

export type TeacherRevisionDraft = {
  feedback: string
}

export type TeacherRevisionValidation =
  | { ok: true; value: TeacherRevisionDraft }
  | { ok: false; message: string }

export type GradebookEntryState =
  | "not_started"
  | "in_progress"
  | "pending_review"
  | "revision_requested"
  | "graded"

type GradingStatus = "pending" | "revision_requested" | "graded"

export function validateTeacherGradeDraft(input: {
  scorePercent: number
  feedback?: string | null
}): TeacherGradeValidation {
  const scorePercent = Number(input.scorePercent)
  if (!Number.isFinite(scorePercent) || scorePercent < 0 || scorePercent > 100) {
    return { ok: false, message: "A nota deve estar entre 0 e 100." }
  }

  const feedback = input.feedback?.trim() ?? ""
  if (feedback.length > 4000) {
    return { ok: false, message: "O feedback deve ter no máximo 4000 caracteres." }
  }

  return {
    ok: true,
    value: {
      scorePercent: Math.round(scorePercent * 100) / 100,
      feedback,
    },
  }
}

export function validateTeacherRevisionRequest(input: {
  feedback?: string | null
}): TeacherRevisionValidation {
  const feedback = input.feedback?.trim() ?? ""
  if (!feedback) {
    return { ok: false, message: "Explique o que o aluno precisa revisar." }
  }
  if (feedback.length > 4000) {
    return { ok: false, message: "O feedback deve ter no máximo 4000 caracteres." }
  }
  return { ok: true, value: { feedback } }
}

export function getEffectiveScore(input: {
  gradingStatus?: GradingStatus
  teacherScorePercent?: number | null
  scorePercent?: number | null
}) {
  if (
    input.gradingStatus === "graded" &&
    typeof input.teacherScorePercent === "number"
  ) {
    return { scorePercent: input.teacherScorePercent, source: "teacher" as const }
  }

  if (typeof input.scorePercent === "number") {
    return { scorePercent: input.scorePercent, source: "automatic" as const }
  }

  return { scorePercent: null, source: null }
}

export function calculateFinalGradeAverage(
  items: Array<{
    gradingStatus?: GradingStatus
    teacherScorePercent?: number | null
  }>
) {
  const grades = items
    .filter((item) => item.gradingStatus === "graded")
    .map((item) => item.teacherScorePercent)
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value))

  if (grades.length === 0) return null
  return Math.round((grades.reduce((sum, value) => sum + value, 0) / grades.length) * 100) / 100
}

export function getGradebookEntryState(
  item: {
    status: "not_started" | "in_progress" | "completed"
    gradingStatus: GradingStatus
  } | null
): GradebookEntryState {
  if (!item) return "not_started"
  if (item.gradingStatus === "revision_requested") return "revision_requested"
  if (item.gradingStatus === "graded") return "graded"
  if (item.status === "completed") return "pending_review"
  return item.status === "in_progress" ? "in_progress" : "not_started"
}
