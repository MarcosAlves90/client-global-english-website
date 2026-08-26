import { z } from "zod"

export const attachmentSchema = z
  .object({
    name: z.string(),
    url: z.string(),
    type: z.enum(["pdf", "video", "link", "audio"]).optional(),
  })
  .strict()

export const audioAttachmentSchema = attachmentSchema.extend({
  type: z.literal("audio"),
})

export const serializedDateSchema = z.union([z.string(), z.date()]).nullable()

export const questionSchema = z
  .object({
    id: z.string(),
    type: z.enum([
      "essay",
      "single_choice",
      "multiple_choice",
      "true_false",
      "short_answer",
      "audio_response",
    ]),
    prompt: z.string(),
    options: z.array(z.string()).optional(),
    correctAnswers: z.array(z.string()).optional(),
    points: z.number().optional(),
    required: z.boolean().optional(),
    promptAudio: audioAttachmentSchema.optional(),
  })
  .strict()

export const userSummarySchema = z
  .object({
    uid: z.string(),
    name: z.string(),
    email: z.string(),
    role: z.enum(["user", "teacher", "admin"]),
    team: z.string().nullable().optional(),
    disabled: z.boolean().optional(),
    isRobot: z.boolean().optional(),
    mustChangePassword: z.boolean().optional(),
    photoURL: z.string().nullable().optional(),
    notificationPreferences: z
      .object({
        activityUpdates: z.boolean(),
        gradesAndFeedback: z.boolean(),
        weeklySummary: z.boolean(),
        marketing: z.boolean(),
      })
      .strict()
      .optional(),
    createdAt: serializedDateSchema,
    updatedAt: serializedDateSchema,
  })
  .strict()

export const attachmentListSchema = z.array(attachmentSchema)
