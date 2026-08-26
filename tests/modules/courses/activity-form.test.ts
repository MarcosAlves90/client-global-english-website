import { describe, expect, it } from "vitest"

import { toCreateCourseActivityPayload } from "@/modules/courses/model/activity-form"
import type { ActivityForm } from "@/modules/courses/ui/manage/courseManagement.types"

function baseForm(): ActivityForm {
  return {
    trackId: "track-1",
    title: "Pronunciation practice",
    type: "assignment",
    estimatedMinutes: "15",
    order: "",
    visibility: "module",
    userIds: [],
    scheduleMode: "now",
    releaseAt: "",
    dueAt: "2026-08-30T10:00",
    closeAt: "",
    attachments: [],
    questions: [
      {
        id: "q-1",
        type: "audio_response",
        prompt: "Read the sentence aloud.",
        options: [],
        correctAnswers: [],
        points: "20",
        required: true,
      },
    ],
  }
}

describe("course activity form payload", () => {
  it("serializes the shared activity creator form for admin or teacher submission", () => {
    expect(toCreateCourseActivityPayload("course-1", baseForm())).toMatchObject({
      courseId: "course-1",
      trackId: "track-1",
      title: "Pronunciation practice",
      estimatedMinutes: 15,
      order: 0,
      visibility: "module",
      releaseAt: null,
      questions: [{ id: "q-1", type: "audio_response", points: 20 }],
    })
  })

  it("keeps scheduled release and targeted students explicit", () => {
    const form = baseForm()
    form.scheduleMode = "scheduled"
    form.releaseAt = "2026-08-26T09:30"
    form.visibility = "users"
    form.userIds = ["student-1"]

    const payload = toCreateCourseActivityPayload("course-1", form)
    expect(payload.userIds).toEqual(["student-1"])
    expect(payload.releaseAt).toBeTruthy()
  })
})
