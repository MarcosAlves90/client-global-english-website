export type UserRole = "user" | "admin"

export type UserProfile = {
  uid: string
  name: string
  email: string
  role: UserRole
  team?: string | null
  disabled?: boolean
  mustChangePassword?: boolean
  photoURL?: string | null
  createdAt: Date | null
  updatedAt: Date | null
}

export type Course = {
  id: string
  title: string
  description: string
  level: "Beginner" | "Intermediate" | "Advanced"
  durationWeeks: number
  coverUrl?: string
}

export type Track = {
  id: string
  courseId: string
  title: string
  description: string
  order: number
  userIds?: string[]
}

export type Activity = {
  id: string
  courseId: string
  trackId: string
  title: string
  type: "lesson" | "quiz" | "assignment" | "project"
  order: number
  estimatedMinutes: number
  visibility?: "module" | "users" | "private"
  userIds?: string[]
  releaseAt?: Date | string | null
  attachments?: { name: string; url: string; type?: "pdf" | "video" | "link" | "audio" }[]
  questions?: {
    id: string
    type: "essay" | "single_choice" | "multiple_choice" | "true_false" | "short_answer"
    prompt: string
    options?: string[]
    correctAnswers?: string[]
    points?: number
    required?: boolean
  }[]
}

export type Material = {
  id: string
  activityId?: string
  courseId?: string
  trackId?: string
  title: string
  type?: "pdf" | "video" | "link" | "audio" | "markdown"
  url?: string
  visibility?: "module" | "users" | "private"
  userIds?: string[]
  releaseAt?: Date | string | null
  markdown?: string
  attachments?: { name: string; url: string; type?: "pdf" | "video" | "link" | "audio" }[]
}

export type Enrollment = {
  id: string
  userId: string
  courseId: string
  status: "active" | "completed" | "paused"
  progress: number
}

export type DashboardCourse = Course & {
  enrollment: Enrollment
  tracks: Track[]
  activities: Activity[]
}

export type AdminUserSummary = UserProfile

export type AdminCourseSummary = {
  id: string
  title: string
  description: string
  level: "Beginner" | "Intermediate" | "Advanced"
  durationWeeks: number
  coverUrl: string | null
  status: string
  modulesCount: number
  studentsCount: number
  activitiesCount: number
}

export type AdminOverview = {
  usersCount: number
  coursesCount: number
}
