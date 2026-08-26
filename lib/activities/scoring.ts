import type { Activity, ActivityAnswerValue } from "@/lib/firebase/types"

type ActivityQuestion = NonNullable<Activity["questions"]>[number]

type ActivityAnswers = Record<string, ActivityAnswerValue>

function normalizeText(value: string) {
  return value.trim().toLowerCase()
}

function compareAsSet(left: string[], right: string[]) {
  if (left.length !== right.length) return false
  const leftSet = new Set(left.map(normalizeText))
  const rightSet = new Set(right.map(normalizeText))
  if (leftSet.size !== rightSet.size) return false
  return Array.from(leftSet).every((item) => rightSet.has(item))
}

export function getActivityQuestionKey(question: ActivityQuestion, index: number) {
  return question.id || `q-${index}`
}

export function isActivityAnswerPresent(value: ActivityAnswerValue) {
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === "boolean") return true
  if (typeof value === "string") return value.trim().length > 0
  return false
}

export function evaluateAutomaticQuestion(
  question: ActivityQuestion,
  answer: ActivityAnswerValue
) {
  const expected = Array.isArray(question.correctAnswers)
    ? question.correctAnswers.filter((item) => typeof item === "string")
    : []
  if (expected.length === 0) return null

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

export function calculateAutomaticActivityScore(
  questions: ActivityQuestion[],
  answers: ActivityAnswers
) {
  const results = questions
    .map((question, index) =>
      evaluateAutomaticQuestion(
        question,
        answers[getActivityQuestionKey(question, index)] ?? null
      )
    )
    .filter((result): result is boolean => result !== null)

  if (results.length === 0) {
    return { scorePercent: null, evaluableCount: 0, correctCount: 0 }
  }

  const correctCount = results.filter(Boolean).length
  return {
    scorePercent: Math.round((correctCount / results.length) * 100),
    evaluableCount: results.length,
    correctCount,
  }
}
