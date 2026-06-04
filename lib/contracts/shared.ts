import { z } from "zod"

const attachmentSchema = z
  .object({
    name: z.string(),
    url: z.string(),
    type: z.enum(["pdf", "video", "link", "audio"]).optional(),
  })
  .strict()

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
    ]),
    prompt: z.string(),
    options: z.array(z.string()).optional(),
    correctAnswers: z.array(z.string()).optional(),
    points: z.number().optional(),
    required: z.boolean().optional(),
  })
  .strict()

export const userSummarySchema = z
  .object({
    uid: z.string(),
    name: z.string(),
    email: z.string(),
    role: z.enum(["user", "admin"]),
    team: z.string().nullable().optional(),
    disabled: z.boolean().optional(),
    isRobot: z.boolean().optional(),
    mustChangePassword: z.boolean().optional(),
    photoURL: z.string().nullable().optional(),
    createdAt: serializedDateSchema,
    updatedAt: serializedDateSchema,
  })
  .strict()

export const attachmentListSchema = z.array(attachmentSchema)
