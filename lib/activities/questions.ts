import type { ActivityQuestionType } from "@/lib/firebase/types"

export const ACTIVITY_QUESTION_TYPE_LABELS: Record<ActivityQuestionType, string> = {
  essay: "Resposta longa",
  short_answer: "Resposta curta",
  single_choice: "Escolha única",
  multiple_choice: "Múltipla escolha",
  true_false: "Verdadeiro ou falso",
  audio_response: "Resposta em áudio",
}

export const ACTIVITY_QUESTION_TYPE_OPTIONS = (
  Object.entries(ACTIVITY_QUESTION_TYPE_LABELS) as Array<[ActivityQuestionType, string]>
).map(([value, label]) => ({ value, label }))
