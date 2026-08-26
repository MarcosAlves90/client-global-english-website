import { calculateAutomaticActivityScore } from "@/lib/activities/scoring"
import { adminAuth, adminDb } from "@/lib/firebase/admin"
import { COLLECTIONS } from "@/lib/firebase/collections"
import type {
  Activity,
  ActivityAnswerValue,
  AdminActivityResponse,
} from "@/lib/firebase/types"

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function readActivityType(value: unknown): Activity["type"] {
  return value === "quiz" || value === "assignment" || value === "project"
    ? value
    : "lesson"
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

export async function listActivityProgress(params: {
  courseId: string
  activityId?: string
}): Promise<AdminActivityResponse[]> {
  let progressQuery: FirebaseFirestore.Query = adminDb
    .collection(COLLECTIONS.activityProgress)
    .where("courseId", "==", params.courseId)

  if (params.activityId) {
    progressQuery = progressQuery.where("activityId", "==", params.activityId)
  }

  const progressSnapshot = await progressQuery.get()
  const userIds = Array.from(
    new Set(progressSnapshot.docs.map((docSnap) => readString(docSnap.data()?.userId)).filter(Boolean))
  )
  const activityIds = Array.from(
    new Set(progressSnapshot.docs.map((docSnap) => readString(docSnap.data()?.activityId)).filter(Boolean))
  )

  const [userDocs, authUsersResult, activityDocs] = await Promise.all([
    userIds.length
      ? adminDb.getAll(...userIds.map((uid) => adminDb.collection(COLLECTIONS.users).doc(uid)))
      : Promise.resolve([]),
    userIds.length
      ? adminAuth.getUsers(userIds.map((uid) => ({ uid })))
      : Promise.resolve({ users: [] }),
    activityIds.length
      ? adminDb.getAll(
          ...activityIds.map((activityId) =>
            adminDb.collection(COLLECTIONS.activities).doc(activityId)
          )
        )
      : Promise.resolve([]),
  ])

  const authByUid = new Map(
    authUsersResult.users.map((userRecord) => [userRecord.uid, userRecord] as const)
  )
  const firestoreByUid = new Map(
    userDocs
      .filter((docSnap) => docSnap.exists)
      .map((docSnap) => [docSnap.id, docSnap.data() ?? {}] as const)
  )
  const activityById = new Map(
    activityDocs
      .filter((docSnap) => docSnap.exists)
      .map((docSnap) => {
        const data = docSnap.data() ?? {}
        return [
          docSnap.id,
          {
            id: docSnap.id,
            title: readString(data.title),
            type: readActivityType(data.type),
            questions: Array.isArray(data.questions)
              ? (data.questions as NonNullable<Activity["questions"]>)
              : [],
          },
        ] as const
      })
  )

  const userById = new Map(
    userIds.map((uid) => {
      const firestoreUser = firestoreByUid.get(uid) ?? ({} as Record<string, unknown>)
      const authUser = authByUid.get(uid)
      const nameFromAuth = readString(authUser?.displayName)
      const nameFromFirestore = readString(firestoreUser.name)
      const emailFromAuth = readString(authUser?.email)
      const emailFromFirestore = readString(firestoreUser.email)
      const photoFromAuth = readString(authUser?.photoURL)
      const photoFromFirestore = readString(firestoreUser.photoURL)

      return [
        uid,
        {
          uid,
          name: nameFromAuth || nameFromFirestore,
          email: emailFromAuth || emailFromFirestore,
          photoURL: photoFromAuth || photoFromFirestore || null,
          isRobot: Boolean(firestoreUser.isRobot),
        },
      ] as const
    })
  )

  return progressSnapshot.docs
    .map((docSnap) => {
      const data = docSnap.data()
      const userId = readString(data.userId)
      const activityId = readString(data.activityId)
      const answers =
        data.answers && typeof data.answers === "object"
          ? (data.answers as Record<string, ActivityAnswerValue>)
          : {}
      const activity = activityById.get(activityId)
      const automaticScore = activity
        ? calculateAutomaticActivityScore(activity.questions, answers).scorePercent
        : null

      return {
        id: docSnap.id,
        userId,
        activityId,
        courseId: readString(data.courseId),
        trackId: readString(data.trackId),
        status:
          data.status === "completed" || data.status === "in_progress"
            ? data.status
            : "not_started",
        answers,
        answeredCount: Number(data.answeredCount ?? 0),
        totalQuestions: Number(data.totalQuestions ?? 0),
        completionPercent: Number(data.completionPercent ?? 0),
        scorePercent: automaticScore,
        gradingStatus:
          data.gradingStatus === "graded" || data.gradingStatus === "revision_requested"
            ? data.gradingStatus
            : "pending",
        teacherScorePercent:
          typeof data.teacherScorePercent === "number"
            ? Number(data.teacherScorePercent)
            : null,
        teacherFeedback:
          typeof data.teacherFeedback === "string" ? data.teacherFeedback : null,
        gradedBy: typeof data.gradedBy === "string" ? data.gradedBy : null,
        gradedAt: readDate(data.gradedAt),
        submittedAt: readDate(data.submittedAt),
        createdAt: readDate(data.createdAt),
        updatedAt: readDate(data.updatedAt),
        user: userById.get(userId),
        activity,
      } satisfies AdminActivityResponse
    })
    .sort((left, right) => {
      const leftTime = new Date(left.updatedAt ?? 0).getTime()
      const rightTime = new Date(right.updatedAt ?? 0).getTime()
      return rightTime - leftTime
    })
}
