import type { ActivityQuestionType, AudioAttachment, MediaAttachment } from "@/lib/firebase/types"
import type * as React from "react"

type CourseFormAttachment = Omit<MediaAttachment, "type"> & {
  type: NonNullable<MediaAttachment["type"]>
}

export type TrackForm = {
  title: string
  description: string
  order: string
  userIds: string[]
}

export type MaterialForm = {
  trackId: string
  title: string
  visibility: "module" | "users" | "private"
  userIds: string[]
  scheduleMode: "now" | "scheduled"
  releaseAt: string
  markdown: string
  attachments: CourseFormAttachment[]
}

export type ActivityForm = {
  trackId: string
  title: string
  type: "lesson" | "quiz" | "assignment" | "project"
  estimatedMinutes: string
  order: string
  visibility: "module" | "users" | "private"
  userIds: string[]
  scheduleMode: "now" | "scheduled"
  releaseAt: string
  dueAt: string
  closeAt: string
  attachments: CourseFormAttachment[]
  questions: {
    id: string
    type: ActivityQuestionType
    prompt: string
    options: string[]
    correctAnswers: string[]
    points: string
    required: boolean
    promptAudio?: AudioAttachment
  }[]
}

export type CourseManagementProviderChildren = {
  children: React.ReactNode
}
