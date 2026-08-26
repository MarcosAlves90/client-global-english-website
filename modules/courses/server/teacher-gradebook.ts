import { calculateAutomaticActivityScore } from "@/lib/activities/scoring"
import { adminAuth, adminDb } from "@/lib/firebase/admin"
import { COLLECTIONS } from "@/lib/firebase/collections"
import { collectGradebookStudentIds } from "@/modules/courses/model/gradebook"
import type {
  Activity,
  ActivityAnswerValue,
  TeacherGradebook,
  TeacherGradebookProgress,
} from "@/lib/firebase/types"

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function readDate(value: unknown) {
  if (value && typeof value === "object" && "toDate" in value) {
    const candidate = value as { toDate?: unknown }
    if (typeof candidate.toDate === "function") {
      return (candidate as { toDate: () => Date }).toDate()
    }
  }
  return null
}

function readActivityType(value: unknown): Activity["type"] {
  return value === "quiz" || value === "assignment" || value === "project"
    ? value
    : "lesson"
}

function chunk<T>(items: T[], size: number) {
  const chunks: T[][] = []
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }
  return chunks
}

async function loadDirectory(userIds: string[]) {
  const batches = chunk(userIds, 100)
  const [userDocBatches, authBatches] = await Promise.all([
    Promise.all(
      batches.map((batch) =>
        adminDb.getAll(
          ...batch.map((uid) => adminDb.collection(COLLECTIONS.users).doc(uid))
        )
      )
    ),
    Promise.all(
      batches.map((batch) =>
        adminAuth.getUsers(batch.map((uid) => ({ uid })))
      )
    ),
  ])

  const firestoreByUid = new Map(
    userDocBatches
      .flat()
      .filter((docSnap) => docSnap.exists)
      .map((docSnap) => [docSnap.id, docSnap.data() ?? {}] as const)
  )
  const authByUid = new Map(
    authBatches.flatMap((batch) => batch.users).map((user) => [user.uid, user] as const)
  )

  return userIds
    .map((uid) => {
      const firestoreUser =
        firestoreByUid.get(uid) ?? ({} as Record<string, unknown>)
      const authUser = authByUid.get(uid)
      return {
        uid,
        name: readString(authUser?.displayName) || readString(firestoreUser.name),
        email: readString(authUser?.email) || readString(firestoreUser.email),
      }
    })
    .sort((left, right) => {
      const leftLabel = left.name || left.email || left.uid
      const rightLabel = right.name || right.email || right.uid
      return leftLabel.localeCompare(rightLabel, "pt-BR")
    })
}

export async function loadTeacherGradebook(courseId: string): Promise<TeacherGradebook> {
  const courseRef = adminDb.collection(COLLECTIONS.courses).doc(courseId)
  const [courseSnapshot, tracksSnapshot, enrollmentsSnapshot, activitiesSnapshot, progressSnapshot] =
    await Promise.all([
      courseRef.get(),
      adminDb.collection(COLLECTIONS.tracks).where("courseId", "==", courseId).get(),
      adminDb.collection(COLLECTIONS.enrollments).where("courseId", "==", courseId).get(),
      adminDb.collection(COLLECTIONS.activities).where("courseId", "==", courseId).get(),
      adminDb.collection(COLLECTIONS.activityProgress).where("courseId", "==", courseId).get(),
    ])

  if (!courseSnapshot.exists) {
    throw new Error("course-not-found")
  }

  const courseData = courseSnapshot.data() ?? {}
  const trackById = new Map(
    tracksSnapshot.docs.map((docSnap) => {
      const data = docSnap.data()
      return [
        docSnap.id,
        {
          title: readString(data.title),
          order: Number(data.order ?? 0),
          userIds: Array.isArray(data.userIds)
            ? data.userIds.map(readString).filter(Boolean)
            : [],
        },
      ] as const
    })
  )

  const activityQuestionsById = new Map<string, NonNullable<Activity["questions"]>>()
  const activities = activitiesSnapshot.docs
    .map((docSnap) => {
      const data = docSnap.data()
      const trackId = readString(data.trackId)
      const questions = Array.isArray(data.questions)
        ? (data.questions as NonNullable<Activity["questions"]>)
        : []
      activityQuestionsById.set(docSnap.id, questions)
      return {
        id: docSnap.id,
        title: readString(data.title),
        type: readActivityType(data.type),
        trackId,
        trackTitle: trackById.get(trackId)?.title ?? "",
        order: Number(data.order ?? 0),
        dueAt: readDate(data.dueAt),
        trackOrder: trackById.get(trackId)?.order ?? 0,
      }
    })
    .sort((left, right) =>
      left.trackOrder - right.trackOrder ||
      left.order - right.order ||
      left.title.localeCompare(right.title, "pt-BR")
    )
    .map((activity) => ({
      id: activity.id,
      title: activity.title,
      type: activity.type,
      trackId: activity.trackId,
      trackTitle: activity.trackTitle,
      order: activity.order,
      dueAt: activity.dueAt,
    }))

  const trackStudentIds = tracksSnapshot.docs.flatMap((docSnap) =>
    Array.isArray(docSnap.data().userIds)
      ? docSnap.data().userIds.map(readString).filter(Boolean)
      : []
  )
  const enrollmentStudentIds = enrollmentsSnapshot.docs
    .map((docSnap) => readString(docSnap.data().userId))
    .filter(Boolean)
  const progressStudentIds = progressSnapshot.docs
    .map((docSnap) => readString(docSnap.data().userId))
    .filter(Boolean)
  const studentIds = collectGradebookStudentIds(
    trackStudentIds,
    enrollmentStudentIds,
    progressStudentIds
  )

  const progress: TeacherGradebookProgress[] = progressSnapshot.docs.map((docSnap) => {
    const data = docSnap.data()
    const activityId = readString(data.activityId)
    const answers =
      data.answers && typeof data.answers === "object"
        ? (data.answers as Record<string, ActivityAnswerValue>)
        : {}
    const questions = activityQuestionsById.get(activityId) ?? []
    const automaticScorePercent = calculateAutomaticActivityScore(questions, answers).scorePercent

    return {
      id: docSnap.id,
      userId: readString(data.userId),
      activityId,
      status:
        data.status === "completed" || data.status === "in_progress"
          ? data.status
          : "not_started",
      gradingStatus:
        data.gradingStatus === "graded" || data.gradingStatus === "revision_requested"
          ? data.gradingStatus
          : "pending",
      automaticScorePercent,
      teacherScorePercent:
        typeof data.teacherScorePercent === "number"
          ? Number(data.teacherScorePercent)
          : null,
      teacherFeedback:
        typeof data.teacherFeedback === "string" ? data.teacherFeedback : null,
      submittedAt: readDate(data.submittedAt),
      reviewedAt: readDate(data.gradedAt),
    }
  })

  return {
    course: {
      id: courseId,
      title: readString(courseData.title),
    },
    activities,
    students: await loadDirectory(studentIds),
    progress,
  }
}
