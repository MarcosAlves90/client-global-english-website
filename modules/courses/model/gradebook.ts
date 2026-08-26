import type { TeacherGradebookProgress } from "@/lib/firebase/types"

export function collectGradebookStudentIds(...groups: string[][]) {
  const ids = new Set<string>()
  groups.forEach((group) => {
    group.forEach((value) => {
      const uid = value.trim()
      if (uid) ids.add(uid)
    })
  })
  return Array.from(ids)
}

export function buildGradebookProgressMap(items: TeacherGradebookProgress[]) {
  return new Map(items.map((item) => [`${item.userId}:${item.activityId}`, item] as const))
}

export function summarizeTeacherGradebook(items: TeacherGradebookProgress[]) {
  return {
    awaitingReviewCount: items.filter(
      (item) => item.status === "completed" && item.gradingStatus === "pending"
    ).length,
    revisionRequestedCount: items.filter(
      (item) => item.gradingStatus === "revision_requested"
    ).length,
    gradedCount: items.filter((item) => item.gradingStatus === "graded").length,
  }
}
