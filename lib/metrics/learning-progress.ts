import type { ActivityProgress, DashboardCourse } from "@/lib/firebase/types"

function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.min(100, Math.max(0, value))
}

export function calculateActivityProgressPercent(
  activityIds: Iterable<string>,
  progressItems: ActivityProgress[]
) {
  const visibleActivityIds = Array.from(
    new Set(Array.from(activityIds).map((id) => id.trim()).filter(Boolean))
  )

  if (visibleActivityIds.length === 0) {
    return 0
  }

  const progressByActivityId = new Map(
    progressItems.map((item) => [item.activityId, item] as const)
  )

  const totalProgress = visibleActivityIds.reduce((sum, activityId) => {
    const progress = progressByActivityId.get(activityId)
    if (!progress) {
      return sum
    }

    if (progress.status === "completed") {
      return sum + 100
    }

    return sum + clampPercent(progress.completionPercent)
  }, 0)

  return Math.round(totalProgress / visibleActivityIds.length)
}

export function calculateDashboardProgressPercent(
  courses: DashboardCourse[],
  progressItems: ActivityProgress[]
) {
  return calculateActivityProgressPercent(
    courses.flatMap((course) => course.activities.map((activity) => activity.id)),
    progressItems
  )
}
