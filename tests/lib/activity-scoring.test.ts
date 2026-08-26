import { describe, expect, it } from "vitest"

import { calculateAutomaticActivityScore } from "@/lib/activities/scoring"

const questions = [
  {
    id: "single",
    type: "single_choice" as const,
    prompt: "Choose",
    options: ["A", "B"],
    correctAnswers: ["B"],
  },
  {
    id: "multi",
    type: "multiple_choice" as const,
    prompt: "Choose all",
    options: ["A", "B", "C"],
    correctAnswers: ["A", "C"],
  },
  {
    id: "essay",
    type: "essay" as const,
    prompt: "Explain",
  },
]

describe("automatic activity scoring", () => {
  it("scores only questions with an automatic answer key", () => {
    expect(
      calculateAutomaticActivityScore(questions, {
        single: "B",
        multi: ["C", "A"],
        essay: "Free text",
      })
    ).toEqual({ scorePercent: 100, evaluableCount: 2, correctCount: 2 })
  })

  it("does not use student-provided score fields", () => {
    expect(
      calculateAutomaticActivityScore(questions, {
        single: "A",
        multi: ["A", "B"],
        essay: "Anything",
      }).scorePercent
    ).toBe(0)
  })

  it("returns no automatic score for subjective-only activities", () => {
    expect(
      calculateAutomaticActivityScore(
        [{ id: "essay", type: "essay", prompt: "Explain" }],
        { essay: "Response" }
      ).scorePercent
    ).toBeNull()
  })
  it("treats audio responses as manual grading while counting a saved URL as answered", async () => {
    const { isActivityAnswerPresent } = await import("@/lib/activities/scoring")
    const audioQuestion = [{ id: "audio", type: "audio_response" as const, prompt: "Pronounce" }]
    const audioUrl = "https://res.cloudinary.com/demo/video/upload/answer.mp3"

    expect(calculateAutomaticActivityScore(audioQuestion, { audio: audioUrl }).scorePercent).toBeNull()
    expect(isActivityAnswerPresent(audioUrl)).toBe(true)
  })

})
