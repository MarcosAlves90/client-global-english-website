import type * as React from "react"

import type {
  Activity,
  AdminActivityResponse,
  AdminCourseSummary,
  AdminUserSummary,
  Material,
  Track,
} from "@/lib/firebase/types"

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

export type UpdateMaterialForm = {
  id: string
  title: string
  markdown: string
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

export interface CourseManagementContextType {
  courseId: string
  course: AdminCourseSummary | null
  tracks: Track[]
  materials: Material[]
  activities: Activity[]
  activityResponses: AdminActivityResponse[]
  availableUsers: AdminUserSummary[]
  loading: {
    course: boolean
    tracks: boolean
    materials: boolean
    activities: boolean
    responses: boolean
    users: boolean
  }
  errors: {
    global: string | null
    track: string | null
    material: string | null
    activity: string | null
    user: string | null
  }
  loadTracks: (force?: boolean) => Promise<void>
  handleDeleteTrack: (track: Track) => Promise<void>
  handleCreateOrUpdateTrack: (
    form: TrackForm,
    isEditing: boolean,
    editingTrackId: string | null
  ) => Promise<void>
  loadMaterials: (force?: boolean) => Promise<void>
  handleDeleteMaterial: (material: Material) => Promise<void>
  handleCreateMaterial: (form: MaterialForm) => Promise<boolean>
  handleUpdateMaterial: (form: UpdateMaterialForm) => Promise<void>
  handleDeleteMaterialAttachment: (
    materialId: string,
    attachmentUrl: string
  ) => Promise<void>
  loadActivities: (force?: boolean) => Promise<void>
  loadActivityResponses: (force?: boolean) => Promise<void>
  handleDeleteActivity: (activity: Activity) => Promise<void>
  handleCreateActivity: (form: ActivityForm) => Promise<boolean>
  handleDeleteActivityAttachment: (
    activityId: string,
    attachmentUrl: string
  ) => Promise<void>
}

export type CourseManagementState = Pick<
  CourseManagementContextType,
  | "courseId"
  | "course"
  | "tracks"
  | "materials"
  | "activities"
  | "activityResponses"
  | "availableUsers"
  | "loading"
  | "errors"
  | "loadTracks"
  | "loadMaterials"
  | "loadActivities"
  | "loadActivityResponses"
>

export type CourseManagementActions = Pick<
  CourseManagementContextType,
  | "handleDeleteTrack"
  | "handleCreateOrUpdateTrack"
  | "handleDeleteMaterial"
  | "handleCreateMaterial"
  | "handleUpdateMaterial"
  | "handleDeleteMaterialAttachment"
  | "handleDeleteActivity"
  | "handleCreateActivity"
  | "handleDeleteActivityAttachment"
>

export type CourseManagementProviderValue = CourseManagementContextType

export type CourseManagementProviderChildren = {
  children: React.ReactNode
}
