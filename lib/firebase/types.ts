export type UserRole = "user" | "teacher" | "admin"

export type NotificationPreferences = {
  activityUpdates: boolean
  gradesAndFeedback: boolean
  weeklySummary: boolean
  marketing: boolean
}

export type UserProfile = {
  uid: string
  name: string
  email: string
  role: UserRole
  team?: string | null
  disabled?: boolean
  isRobot?: boolean
  mustChangePassword?: boolean
  photoURL?: string | null
  notificationPreferences?: NotificationPreferences
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
  teacherIds?: string[]
}

export type Track = {
  id: string
  courseId: string
  title: string
  description: string
  order: number
  userIds?: string[]
}

export type MediaAttachment = {
  name: string
  url: string
  type?: "pdf" | "video" | "link" | "audio"
}

export type AudioAttachment = MediaAttachment & { type: "audio" }

export type ActivityQuestionType =
  | "essay"
  | "single_choice"
  | "multiple_choice"
  | "true_false"
  | "short_answer"
  | "audio_response"

export type ActivityQuestion = {
  id: string
  type: ActivityQuestionType
  prompt: string
  options?: string[]
  correctAnswers?: string[]
  points?: number
  required?: boolean
  promptAudio?: AudioAttachment
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
  dueAt?: Date | string | null
  closeAt?: Date | string | null
  attachments?: MediaAttachment[]
  questions?: ActivityQuestion[]
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
  attachments?: MediaAttachment[]
}

export type Enrollment = {
  id: string
  userId: string
  courseId: string
  status: "active" | "completed" | "paused"
  progress: number
}

export type ActivityAnswerValue = string | string[] | boolean | null

export type ActivityProgressStatus = "not_started" | "in_progress" | "completed"
export type ActivityGradingStatus = "pending" | "revision_requested" | "graded"

export type ActivityProgress = {
  id: string
  userId: string
  activityId: string
  courseId: string
  trackId: string
  status: ActivityProgressStatus
  answers: Record<string, ActivityAnswerValue>
  answeredCount: number
  totalQuestions: number
  completionPercent: number
  scorePercent: number | null
  gradingStatus: ActivityGradingStatus
  teacherScorePercent: number | null
  teacherFeedback: string | null
  gradedBy: string | null
  gradedAt: Date | null
  submittedAt: Date | null
  createdAt: Date | null
  updatedAt: Date | null
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
  teacherIds?: string[]
}

export type AdminActivityResponse = {
  id: string
  userId: string
  activityId: string
  courseId: string
  trackId: string
  status: ActivityProgressStatus
  answers: Record<string, ActivityAnswerValue>
  answeredCount: number
  totalQuestions: number
  completionPercent: number
  scorePercent: number | null
  gradingStatus: ActivityGradingStatus
  teacherScorePercent: number | null
  teacherFeedback: string | null
  gradedBy: string | null
  gradedAt: Date | string | null
  submittedAt: Date | string | null
  createdAt: Date | string | null
  updatedAt: Date | string | null
  user?: {
    uid: string
    name: string
    email: string
    photoURL?: string | null
    isRobot?: boolean
  }
  activity?: {
    id: string
    title: string
    type: Activity["type"]
    questions: NonNullable<Activity["questions"]>
  }
}


export type TeacherGradebookActivity = {
  id: string
  title: string
  type: Activity["type"]
  trackId: string
  trackTitle: string
  order: number
  dueAt: Date | string | null
}

export type TeacherGradebookStudent = {
  uid: string
  name: string
  email: string
}

export type TeacherGradebookProgress = {
  id: string
  userId: string
  activityId: string
  status: ActivityProgressStatus
  gradingStatus: ActivityGradingStatus
  automaticScorePercent: number | null
  teacherScorePercent: number | null
  teacherFeedback: string | null
  submittedAt: Date | string | null
  reviewedAt: Date | string | null
}

export type TeacherGradebook = {
  course: {
    id: string
    title: string
  }
  activities: TeacherGradebookActivity[]
  students: TeacherGradebookStudent[]
  progress: TeacherGradebookProgress[]
}

export type AdminOverview = {
  usersCount: number
  coursesCount: number
}

export type AdminUserStats = {
  totalUsersCount: number
  disabledUsersCount: number
  teacherUsersCount: number
  adminUsersCount: number
}

export type AdminCourseCatalogMetrics = {
  coursesCount: number
  uniqueStudentsCount: number
  modulesCount: number
  activitiesCount: number
}

export type AdminCourseCatalog = {
  items: AdminCourseSummary[]
  metrics: AdminCourseCatalogMetrics
}


export type SupportTicketStatus = "open" | "resolved"

export type SupportTicket = {
  id: string
  userId: string
  subject: string
  message: string
  status: SupportTicketStatus
  createdAt: Date | null
  updatedAt: Date | null
}
