export type UserRole = "user" | "admin"

export type UserProfile = {
  uid: string
  name: string
  email: string
  role: UserRole
  team?: string | null
  disabled?: boolean
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
}

export type Activity = {
  id: string
  courseId: string
  trackId: string
  title: string
  type: "lesson" | "quiz" | "assignment" | "project"
  order: number
  estimatedMinutes: number
}

export type Material = {
  id: string
  activityId: string
  title: string
  type: "pdf" | "video" | "link" | "audio"
  url: string
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
  status: string
  modulesCount: number
  studentsCount: number
}

export type AdminOverview = {
  usersCount: number
  coursesCount: number
}

