import { serializeActivityDateInput } from "@/lib/activities/deadlines"
import type { CreateCourseActivityPayload } from "@/modules/activities"
import type { ActivityForm } from "@/modules/courses/ui/manage/courseManagement.types"

export function toCreateCourseActivityPayload(
  courseId: string,
  form: ActivityForm
): CreateCourseActivityPayload {
  return {
    courseId,
    trackId: form.trackId,
    title: form.title,
    type: form.type,
    estimatedMinutes: form.estimatedMinutes ? Number(form.estimatedMinutes) : 0,
    order: form.order ? Number(form.order) : 0,
    visibility: form.visibility,
    userIds: form.userIds,
    releaseAt:
      form.scheduleMode === "scheduled"
        ? serializeActivityDateInput(form.releaseAt)
        : null,
    dueAt: serializeActivityDateInput(form.dueAt),
    closeAt: serializeActivityDateInput(form.closeAt),
    attachments: form.attachments,
    questions: form.questions.map((question) => ({
      ...question,
      points: question.points ? Number(question.points) : 0,
    })),
  }
}
