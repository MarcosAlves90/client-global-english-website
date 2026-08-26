import { describe, expect, it } from "vitest"

import { createActivityBodySchema } from "@/lib/contracts/admin"
import { questionSchema } from "@/lib/contracts/shared"
import { ACTIVITY_QUESTION_TYPE_LABELS } from "@/lib/activities/questions"

describe("activity audio contracts", () => {
  const promptAudio = {
    name: "Referência de pronúncia",
    url: "https://res.cloudinary.com/demo/video/upload/reference.mp3",
    type: "audio" as const,
  }

  it("accepts audio-response questions with an optional teacher reference audio", () => {
    expect(
      questionSchema.parse({
        id: "q-audio",
        type: "audio_response",
        prompt: "Pronuncie a frase.",
        points: 10,
        required: true,
        promptAudio,
      })
    ).toMatchObject({ type: "audio_response", promptAudio })
  })

  it("allows the same question through the admin activity creation contract", () => {
    const parsed = createActivityBodySchema.parse({
      courseId: "course-1",
      trackId: "track-1",
      title: "Pronunciation",
      type: "assignment",
      estimatedMinutes: 10,
      questions: [
        {
          id: "q-audio",
          type: "audio_response",
          prompt: "Pronuncie a frase.",
          promptAudio,
        },
      ],
    })

    expect(parsed.questions?.[0]?.type).toBe("audio_response")
    expect(ACTIVITY_QUESTION_TYPE_LABELS.audio_response).toBe("Resposta em áudio")
  })
})
