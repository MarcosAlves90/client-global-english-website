import { z } from "zod"

import {
  attachmentListSchema,
  questionSchema,
  serializedDateSchema,
  userSummarySchema,
} from "./shared"

const courseLevelSchema = z.enum(["Beginner", "Intermediate", "Advanced"])
const visibilitySchema = z.enum(["module", "users", "private"])
const activityTypeSchema = z.enum(["lesson", "quiz", "assignment", "project"])
const materialTypeSchema = z.enum(["pdf", "video", "link", "audio", "markdown"])

export const adminCourseSummarySchema = z
  .object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    level: courseLevelSchema,
    durationWeeks: z.number(),
    coverUrl: z.string().nullable(),
    status: z.string(),
    modulesCount: z.number(),
    studentsCount: z.number(),
    activitiesCount: z.number(),
    teacherIds: z.array(z.string()).optional(),
  })
  .strict()

export const adminCourseCatalogSchema = z
  .object({
    items: z.array(adminCourseSummarySchema),
    metrics: z
      .object({
        coursesCount: z.number(),
        uniqueStudentsCount: z.number(),
        modulesCount: z.number(),
        activitiesCount: z.number(),
      })
      .strict(),
  })
  .strict()

export const trackSchema = z
  .object({
    id: z.string(),
    courseId: z.string(),
    title: z.string(),
    description: z.string(),
    order: z.number(),
    userIds: z.array(z.string()).optional(),
  })
  .strict()

export const materialSchema = z
  .object({
    id: z.string(),
    activityId: z.string().optional(),
    courseId: z.string().optional(),
    trackId: z.string().optional(),
    title: z.string(),
    type: materialTypeSchema.optional(),
    url: z.string().optional(),
    visibility: visibilitySchema.optional(),
    userIds: z.array(z.string()).optional(),
    releaseAt: serializedDateSchema.optional(),
    markdown: z.string().optional(),
    attachments: attachmentListSchema.optional(),
  })
  .strict()

export const activitySchema = z
  .object({
    id: z.string(),
    courseId: z.string(),
    trackId: z.string(),
    title: z.string(),
    type: activityTypeSchema,
    order: z.number(),
    estimatedMinutes: z.number(),
    visibility: visibilitySchema.optional(),
    userIds: z.array(z.string()).optional(),
    releaseAt: serializedDateSchema.optional(),
    dueAt: serializedDateSchema.optional(),
    closeAt: serializedDateSchema.optional(),
    attachments: attachmentListSchema.optional(),
    questions: z.array(questionSchema).optional(),
  })
  .strict()

export const adminUsersPageResponseSchema = z
  .object({
    items: z.array(userSummarySchema),
    nextCursor: z.string().nullable(),
    stats: z
      .object({
        totalUsersCount: z.number(),
        disabledUsersCount: z.number(),
        teacherUsersCount: z.number(),
        adminUsersCount: z.number(),
      })
      .strict(),
  })
  .strict()

export const createAdminUserResponseSchema = userSummarySchema
  .extend({
    initialPassword: z.string().optional(),
  })
  .strict()

export const createCourseBodySchema = z
  .object({
    id: z.string().optional(),
    title: z.string().optional(),
    description: z.string().optional(),
    level: courseLevelSchema.optional(),
    durationWeeks: z.number().optional(),
    coverUrl: z.string().nullable().optional(),
    status: z.string().optional(),
    teacherIds: z.array(z.string()).optional(),
  })
  .strict()

export const updateCourseBodySchema = createCourseBodySchema
  .extend({
    id: z.string().optional(),
  })
  .strict()

export const deleteCourseBodySchema = z
  .object({
    id: z.string(),
  })
  .strict()

export const createTrackBodySchema = z
  .object({
    id: z.string().optional(),
    courseId: z.string().optional(),
    title: z.string().optional(),
    description: z.string().optional(),
    order: z.number().optional(),
    userIds: z.array(z.string()).optional(),
  })
  .strict()

export const updateTrackBodySchema = createTrackBodySchema
  .extend({
    id: z.string().optional(),
  })
  .strict()

export const deleteTrackBodySchema = z
  .object({
    id: z.string(),
  })
  .strict()

export const createMaterialBodySchema = z
  .object({
    courseId: z.string().optional(),
    trackId: z.string().optional(),
    title: z.string().optional(),
    type: materialTypeSchema.optional(),
    url: z.string().optional(),
    visibility: visibilitySchema.optional(),
    userIds: z.array(z.string()).optional(),
    releaseAt: z.string().nullable().optional(),
    markdown: z.string().optional(),
    attachments: z
      .array(
        z
          .object({
            name: z.string().optional(),
            url: z.string().optional(),
            type: z.enum(["pdf", "video", "link", "audio"]).optional(),
          })
          .strict()
      )
      .optional(),
  })
  .strict()

export const updateMaterialBodySchema = z
  .object({
    id: z.string().optional(),
    title: z.string().optional(),
    trackId: z.string().optional(),
    visibility: visibilitySchema.optional(),
    userIds: z.array(z.string()).optional(),
    releaseAt: z.string().nullable().optional(),
    markdown: z.string().optional(),
    attachments: z
      .array(
        z
          .object({
            name: z.string().optional(),
            url: z.string().optional(),
            type: z.enum(["pdf", "video", "link", "audio"]).optional(),
          })
          .strict()
      )
      .optional(),
  })
  .strict()

export const deleteMaterialBodySchema = z
  .object({
    id: z.string(),
  })
  .strict()

export const createActivityBodySchema = z
  .object({
    courseId: z.string().optional(),
    trackId: z.string().optional(),
    title: z.string().optional(),
    type: activityTypeSchema.optional(),
    order: z.number().optional(),
    estimatedMinutes: z.number().optional(),
    visibility: visibilitySchema.optional(),
    userIds: z.array(z.string()).optional(),
    releaseAt: z.string().nullable().optional(),
    dueAt: z.string().nullable().optional(),
    closeAt: z.string().nullable().optional(),
    attachments: z
      .array(
        z
          .object({
            name: z.string().optional(),
            url: z.string().optional(),
            type: z.enum(["pdf", "video", "link", "audio"]).optional(),
          })
          .strict()
      )
      .optional(),
    questions: z
      .array(
        z
          .object({
            id: z.string().optional(),
            type: questionSchema.shape.type,
            prompt: z.string().optional(),
            options: z.array(z.string()).optional(),
            correctAnswers: z.array(z.string()).optional(),
            points: z.number().optional(),
            required: z.boolean().optional(),
            promptAudio: questionSchema.shape.promptAudio,
          })
          .strict()
      )
      .optional(),
  })
  .strict()

export const updateActivityBodySchema = z
  .object({
    id: z.string().optional(),
    attachments: z
      .array(
        z
          .object({
            name: z.string().optional(),
            url: z.string().optional(),
            type: z.enum(["pdf", "video", "link", "audio"]).optional(),
          })
          .strict()
      )
      .optional(),
  })
  .strict()

export const deleteActivityBodySchema = z
  .object({
    id: z.string(),
  })
  .strict()

export const adminAttachmentDeleteBodySchema = z
  .object({
    entityType: z.enum(["material", "activity"]).optional(),
    entityId: z.string().optional(),
    attachmentUrl: z.string().optional(),
  })
  .strict()

export const upsertAdminUserBodySchema = z
  .object({
    uid: z.string().optional(),
    name: z.string().optional(),
    email: z.string().optional(),
    role: z.enum(["user", "teacher", "admin"]).optional(),
    team: z.string().nullable().optional(),
    disabled: z.boolean().optional(),
    isRobot: z.boolean().optional(),
  })
  .strict()

export const deleteAdminUserBodySchema = z
  .object({
    uid: z.string(),
  })
  .strict()


export const adminActivityResponseSchema = z
  .object({
    id: z.string(),
    userId: z.string(),
    activityId: z.string(),
    courseId: z.string(),
    trackId: z.string(),
    status: z.enum(["not_started", "in_progress", "completed"]),
    answers: z.record(z.string(), z.union([z.string(), z.array(z.string()), z.boolean(), z.null()])),
    answeredCount: z.number(),
    totalQuestions: z.number(),
    completionPercent: z.number(),
    scorePercent: z.number().nullable(),
    gradingStatus: z.enum(["pending", "revision_requested", "graded"]),
    teacherScorePercent: z.number().nullable(),
    teacherFeedback: z.string().nullable(),
    gradedBy: z.string().nullable(),
    gradedAt: serializedDateSchema,
    submittedAt: serializedDateSchema,
    createdAt: serializedDateSchema,
    updatedAt: serializedDateSchema,
    user: z
      .object({
        uid: z.string(),
        name: z.string(),
        email: z.string(),
        photoURL: z.string().nullable().optional(),
        isRobot: z.boolean().optional(),
      })
      .strict()
      .optional(),
    activity: z
      .object({
        id: z.string(),
        title: z.string(),
        type: activityTypeSchema,
        questions: z.array(questionSchema),
      })
      .strict()
      .optional(),
  })
  .strict()

export const teacherGradeBodySchema = z
  .object({
    id: z.string().min(1),
    action: z.enum(["grade", "request_revision"]).optional(),
    scorePercent: z.number().min(0).max(100).optional(),
    feedback: z.string().max(4000).optional(),
  })
  .strict()

export const teacherGradebookSchema = z
  .object({
    course: z
      .object({
        id: z.string(),
        title: z.string(),
      })
      .strict(),
    activities: z.array(
      z
        .object({
          id: z.string(),
          title: z.string(),
          type: activityTypeSchema,
          trackId: z.string(),
          trackTitle: z.string(),
          order: z.number(),
          dueAt: serializedDateSchema,
        })
        .strict()
    ),
    students: z.array(
      z
        .object({
          uid: z.string(),
          name: z.string(),
          email: z.string(),
        })
        .strict()
    ),
    progress: z.array(
      z
        .object({
          id: z.string(),
          userId: z.string(),
          activityId: z.string(),
          status: z.enum(["not_started", "in_progress", "completed"]),
          gradingStatus: z.enum(["pending", "revision_requested", "graded"]),
          automaticScorePercent: z.number().nullable(),
          teacherScorePercent: z.number().nullable(),
          teacherFeedback: z.string().nullable(),
          submittedAt: serializedDateSchema,
          reviewedAt: serializedDateSchema,
        })
        .strict()
    ),
  })
  .strict()
