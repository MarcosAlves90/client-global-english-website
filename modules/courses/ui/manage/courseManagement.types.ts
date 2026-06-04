import type * as React from "react"

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
  attachments: { name: string; url: string; type: "pdf" | "video" | "link" | "audio" }[]
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
  attachments: { name: string; url: string; type: "pdf" | "video" | "link" | "audio" }[]
  questions: {
    id: string
    type: "essay" | "single_choice" | "multiple_choice" | "true_false" | "short_answer"
    prompt: string
    options: string[]
    correctAnswers: string[]
    points: string
    required: boolean
  }[]
}

export type CourseManagementProviderChildren = {
  children: React.ReactNode
}
