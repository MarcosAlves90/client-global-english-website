import { z } from "zod"

import { activitySchema, adminCourseSummarySchema, trackSchema } from "@/lib/contracts/admin"
import { userSummarySchema } from "@/lib/contracts/shared"

export const teacherCourseWorkspaceSchema = z
  .object({
    course: adminCourseSummarySchema,
    tracks: z.array(trackSchema),
    students: z.array(userSummarySchema),
    activities: z.array(activitySchema),
  })
  .strict()

export type TeacherCourseWorkspace = z.infer<typeof teacherCourseWorkspaceSchema>
