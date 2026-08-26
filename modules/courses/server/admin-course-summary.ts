import { normalizeCloudinaryUrlValue } from "@/lib/cloudinary-url"
import type {
  AdminCourseCatalog,
  AdminCourseSummary,
} from "@/lib/firebase/types"

type SnapshotLike = {
  id: string
  data: () => Record<string, unknown> | undefined
}

type CourseRelationCounts = {
  modulesCount: number
  activitiesCount: number
  studentIds: Set<string>
}

function getCourseCounts(
  countsByCourseId: Map<string, CourseRelationCounts>,
  courseId: string
) {
  let counts = countsByCourseId.get(courseId)
  if (!counts) {
    counts = {
      modulesCount: 0,
      activitiesCount: 0,
      studentIds: new Set<string>(),
    }
    countsByCourseId.set(courseId, counts)
  }
  return counts
}

function readNonEmptyString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null
}

export function buildAdminCourseCatalog(params: {
  courses: SnapshotLike[]
  tracks: SnapshotLike[]
  enrollments: SnapshotLike[]
  activities: SnapshotLike[]
}): AdminCourseCatalog {
  const countsByCourseId = new Map<string, CourseRelationCounts>()
  const courseIds = new Set(params.courses.map((course) => course.id))
  const uniqueStudentIds = new Set<string>()

  params.tracks.forEach((track) => {
    const data = track.data() ?? {}
    const courseId = readNonEmptyString(data.courseId)
    if (!courseId || !courseIds.has(courseId)) return

    const counts = getCourseCounts(countsByCourseId, courseId)
    counts.modulesCount += 1

    const userIds = Array.isArray(data.userIds) ? data.userIds : []
    userIds.forEach((userId) => {
      const normalizedUserId = readNonEmptyString(userId)
      if (normalizedUserId) {
        counts.studentIds.add(normalizedUserId)
        uniqueStudentIds.add(normalizedUserId)
      }
    })
  })

  params.enrollments.forEach((enrollment) => {
    const data = enrollment.data() ?? {}
    const courseId = readNonEmptyString(data.courseId)
    const userId = readNonEmptyString(data.userId)
    if (!courseId || !userId || !courseIds.has(courseId)) return

    getCourseCounts(countsByCourseId, courseId).studentIds.add(userId)
    uniqueStudentIds.add(userId)
  })

  params.activities.forEach((activity) => {
    const data = activity.data() ?? {}
    const courseId = readNonEmptyString(data.courseId)
    if (!courseId || !courseIds.has(courseId)) return

    getCourseCounts(countsByCourseId, courseId).activitiesCount += 1
  })

  const items = params.courses
    .map((course): AdminCourseSummary => {
      const data = course.data() ?? {}
      const counts = countsByCourseId.get(course.id)

      return {
        id: course.id,
        title: (data.title as string | undefined) ?? "",
        description: (data.description as string | undefined) ?? "",
        level:
          (data.level as "Beginner" | "Intermediate" | "Advanced" | undefined) ??
          "Beginner",
        durationWeeks: Number(data.durationWeeks ?? 0),
        coverUrl: normalizeCloudinaryUrlValue(readNonEmptyString(data.coverUrl)) ?? null,
        status: (data.status as string | undefined) ?? "Inscrições abertas",
        teacherIds: Array.from(
          new Set(
            (Array.isArray(data.teacherIds) ? data.teacherIds : [])
              .map(readNonEmptyString)
              .filter((teacherId): teacherId is string => Boolean(teacherId))
          )
        ),
        modulesCount: counts?.modulesCount ?? 0,
        studentsCount: counts?.studentIds.size ?? 0,
        activitiesCount: counts?.activitiesCount ?? 0,
      }
    })
    .sort((left, right) => left.title.localeCompare(right.title))

  return {
    items,
    metrics: {
      coursesCount: items.length,
      uniqueStudentsCount: uniqueStudentIds.size,
      modulesCount: items.reduce((sum, course) => sum + course.modulesCount, 0),
      activitiesCount: items.reduce(
        (sum, course) => sum + course.activitiesCount,
        0
      ),
    },
  }
}

export function buildAdminCourseSummaries(params: {
  courses: SnapshotLike[]
  tracks: SnapshotLike[]
  enrollments: SnapshotLike[]
  activities: SnapshotLike[]
}) {
  return buildAdminCourseCatalog(params).items
}
