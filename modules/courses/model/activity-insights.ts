import type {
  Activity,
  AdminActivityResponse,
  Track,
} from "@/lib/firebase/types"

function countUniqueUserIds(userIds: Iterable<string>) {
  return new Set(
    Array.from(userIds, (userId) => userId.trim()).filter(Boolean)
  ).size
}

export function getActivityAudienceSize(params: {
  activity: Pick<Activity, "visibility" | "userIds" | "trackId">
  track: Pick<Track, "userIds"> | null | undefined
  courseStudentCount: number
}) {
  const visibility = params.activity.visibility ?? "module"
  if (visibility === "private") {
    return 0
  }

  const trackUserIds = params.track?.userIds ?? []

  if (visibility === "users") {
    const activityUserIds = new Set(
      (params.activity.userIds ?? []).map((userId) => userId.trim()).filter(Boolean)
    )
    if (trackUserIds.length === 0) {
      return activityUserIds.size
    }

    return countUniqueUserIds(
      trackUserIds.filter((userId) => activityUserIds.has(userId.trim()))
    )
  }

  if (trackUserIds.length > 0) {
    return countUniqueUserIds(trackUserIds)
  }

  return Math.max(0, Math.floor(params.courseStudentCount))
}

export function getActivityCompletionPercent(
  responses: AdminActivityResponse[],
  audienceSize: number
) {
  if (audienceSize <= 0) {
    return null
  }

  const completedUsers = new Set(
    responses
      .filter((response) => response.status === "completed")
      .map((response) => response.userId.trim())
      .filter(Boolean)
  )

  return Math.min(100, Math.round((completedUsers.size / audienceSize) * 100))
}

export function getAverageActivityScore(responses: AdminActivityResponse[]) {
  const scores = responses
    .filter((response) => response.status === "completed")
    .map((response) => {
      if (
        response.gradingStatus === "graded" &&
        typeof response.teacherScorePercent === "number" &&
        Number.isFinite(response.teacherScorePercent)
      ) {
        return response.teacherScorePercent
      }
      return typeof response.scorePercent === "number" &&
        Number.isFinite(response.scorePercent)
        ? response.scorePercent
        : null
    })
    .filter((score): score is number => score !== null)

  if (scores.length === 0) {
    return null
  }

  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
}
