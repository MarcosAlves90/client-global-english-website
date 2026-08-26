import {
  collection,
  doc,
  documentId,
  getCountFromServer,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore"
import { runSingleFlight } from "@/lib/async/single-flight"
import { db, hasFirebaseConfig } from "@/lib/firebase/client"
import { COLLECTIONS } from "@/lib/firebase/collections"
import { isContentAvailableToUser } from "@/lib/firebase/content-access"
import {
  normalizeCloudinaryUrlItems,
  normalizeCloudinaryUrlValue,
} from "@/lib/cloudinary-url"
import type {
  Activity,
  ActivityAnswerValue,
  ActivityProgress,
  ActivityProgressStatus,
  AdminOverview,
  Course,
  DashboardCourse,
  Enrollment,
  Material,
  NotificationPreferences,
  SupportTicket,
  Track,
  UserProfile,
  UserRole,
} from "@/lib/firebase/types"

function getDbOrThrow() {
  if (!hasFirebaseConfig || !db) {
    throw new Error("Firestore não configurado.")
  }

  return db
}

const FIRESTORE_IN_LIMIT = 10

const enrollmentRequests = new Map<string, Promise<Enrollment[]>>()
const visibleTrackRequests = new Map<string, Promise<Track[]>>()
const visibleActivityRequests = new Map<string, Promise<Activity[]>>()
const visibleMaterialRequests = new Map<string, Promise<Material[]>>()
const activityProgressListRequests = new Map<string, Promise<ActivityProgress[]>>()

function getUserCourseRequestKey(uid: string, courseIds: string[]) {
  return `${uid}:${[...courseIds].sort().join(",")}`
}

function getEnrollmentCourseIds(enrollments: Enrollment[]) {
  return Array.from(
    new Set(
      enrollments
        .map((enrollment) => enrollment.courseId?.trim())
        .filter((courseId): courseId is string => Boolean(courseId))
    )
  )
}

function chunkArray<T>(items: T[], size = FIRESTORE_IN_LIMIT): T[][] {
  const chunks: T[][] = []
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }
  return chunks
}

function isFirestorePermissionDenied(error: unknown) {
  const code =
    error && typeof error === "object" && "code" in error
      ? String((error as { code?: string }).code)
      : ""
  return code.toLowerCase().replace("firestore/", "") === "permission-denied"
}

function readStringField(value: unknown) {
  return typeof value === "string" ? value : ""
}

async function loadEnrollmentsWithTrackFallback(
  uid: string
): Promise<Enrollment[]> {
  const firestore = getDbOrThrow()

  let enrollments: Enrollment[] = []
  try {
    const enrollmentQuery = query(
      collection(firestore, COLLECTIONS.enrollments),
      where("userId", "==", uid)
    )
    const enrollmentSnapshots = await getDocs(enrollmentQuery)
    enrollments = enrollmentSnapshots.docs.map((docSnap) => {
      const data = docSnap.data()
      return {
        id: docSnap.id,
        userId: data.userId,
        courseId: data.courseId,
        status: data.status ?? "active",
        progress: data.progress ?? 0,
      }
    })
  } catch (error) {
    if (!isFirestorePermissionDenied(error)) {
      throw error
    }
  }

  if (enrollments.length) {
    return enrollments
  }

  let trackSnapshot
  try {
    trackSnapshot = await getDocs(
      query(
        collection(firestore, COLLECTIONS.tracks),
        where("userIds", "array-contains", uid)
      )
    )
  } catch (error) {
    if (isFirestorePermissionDenied(error)) {
      return []
    }
    throw error
  }
  const fallbackCourseIds = Array.from(
    new Set(
      trackSnapshot.docs
        .map((docSnap) => docSnap.data()?.courseId)
        .filter((courseId): courseId is string => Boolean(courseId))
    )
  )

  return fallbackCourseIds.map((courseId) => ({
    id: `fallback-${courseId}-${uid}`,
    userId: uid,
    courseId,
    status: "active",
    progress: 0,
  }))
}

function fetchEnrollmentsWithTrackFallback(uid: string) {
  return runSingleFlight(enrollmentRequests, uid, () =>
    loadEnrollmentsWithTrackFallback(uid)
  )
}

async function loadTracksVisibleToUserByCourseIds(
  courseIds: string[],
  uid: string
): Promise<Track[]> {
  const firestore = getDbOrThrow()
  const chunks = chunkArray(courseIds)
  const deduped = new Map<string, Track>()

  const loadChunk = async (idsChunk: string[]) => {
    try {
      const publicSnapshot = await getDocs(
        query(
          collection(firestore, COLLECTIONS.tracks),
          where("courseId", "in", idsChunk),
          where("userIds", "==", [])
        )
      )
      publicSnapshot.docs.forEach((docSnap) => {
        const data = docSnap.data()
        deduped.set(docSnap.id, {
          id: docSnap.id,
          courseId: data.courseId,
          title: data.title ?? "",
          description: data.description ?? "",
          order: data.order ?? 0,
          userIds: Array.isArray(data.userIds) ? data.userIds : [],
        })
      })
    } catch (error) {
      if (!isFirestorePermissionDenied(error)) {
        throw error
      }
    }

    try {
      const assignedSnapshot = await getDocs(
        query(
          collection(firestore, COLLECTIONS.tracks),
          where("courseId", "in", idsChunk),
          where("userIds", "array-contains", uid)
        )
      )
      assignedSnapshot.docs.forEach((docSnap) => {
        const data = docSnap.data()
        deduped.set(docSnap.id, {
          id: docSnap.id,
          courseId: data.courseId,
          title: data.title ?? "",
          description: data.description ?? "",
          order: data.order ?? 0,
          userIds: Array.isArray(data.userIds) ? data.userIds : [],
        })
      })
    } catch (error) {
      if (!isFirestorePermissionDenied(error)) {
        throw error
      }
    }
  }

  await Promise.all(chunks.map((idsChunk) => loadChunk(idsChunk)))

  return Array.from(deduped.values())
}

function fetchTracksVisibleToUserByCourseIds(courseIds: string[], uid: string) {
  const key = getUserCourseRequestKey(uid, courseIds)
  return runSingleFlight(visibleTrackRequests, key, () =>
    loadTracksVisibleToUserByCourseIds(courseIds, uid)
  )
}

async function loadActivitiesVisibleToUserByCourseIds(
  courseIds: string[],
  uid: string
): Promise<Activity[]> {
  const firestore = getDbOrThrow()
  const chunks = chunkArray(courseIds)
  const deduped = new Map<string, Activity>()

  const loadChunk = async (idsChunk: string[]) => {
    try {
      const publicSnapshot = await getDocs(
        query(
          collection(firestore, COLLECTIONS.activities),
          where("courseId", "in", idsChunk),
          where("visibility", "==", "module")
        )
      )
      publicSnapshot.docs.forEach((docSnap) => {
        const data = docSnap.data()
        deduped.set(docSnap.id, {
          id: docSnap.id,
          courseId: data.courseId,
          trackId: data.trackId,
          title: data.title ?? "",
          type: data.type ?? "lesson",
          order: data.order ?? 0,
          estimatedMinutes: data.estimatedMinutes ?? 0,
          visibility: data.visibility ?? "module",
          userIds: Array.isArray(data.userIds) ? data.userIds : [],
          releaseAt: data.releaseAt?.toDate?.() ?? null,
          dueAt: data.dueAt?.toDate?.() ?? null,
          closeAt: data.closeAt?.toDate?.() ?? null,
          attachments: normalizeCloudinaryUrlItems(
            Array.isArray(data.attachments) ? data.attachments : []
          ),
          questions: Array.isArray(data.questions) ? data.questions : [],
        })
      })
    } catch (error) {
      if (!isFirestorePermissionDenied(error)) {
        throw error
      }
    }

    try {
      const usersSnapshot = await getDocs(
        query(
          collection(firestore, COLLECTIONS.activities),
          where("courseId", "in", idsChunk),
          where("visibility", "==", "users"),
          where("userIds", "array-contains", uid)
        )
      )
      usersSnapshot.docs.forEach((docSnap) => {
        const data = docSnap.data()
        deduped.set(docSnap.id, {
          id: docSnap.id,
          courseId: data.courseId,
          trackId: data.trackId,
          title: data.title ?? "",
          type: data.type ?? "lesson",
          order: data.order ?? 0,
          estimatedMinutes: data.estimatedMinutes ?? 0,
          visibility: data.visibility ?? "module",
          userIds: Array.isArray(data.userIds) ? data.userIds : [],
          releaseAt: data.releaseAt?.toDate?.() ?? null,
          dueAt: data.dueAt?.toDate?.() ?? null,
          closeAt: data.closeAt?.toDate?.() ?? null,
          attachments: normalizeCloudinaryUrlItems(
            Array.isArray(data.attachments) ? data.attachments : []
          ),
          questions: Array.isArray(data.questions) ? data.questions : [],
        })
      })
    } catch (error) {
      if (!isFirestorePermissionDenied(error)) {
        throw error
      }
    }
  }

  await Promise.all(chunks.map((idsChunk) => loadChunk(idsChunk)))

  return Array.from(deduped.values())
}

function fetchActivitiesVisibleToUserByCourseIds(courseIds: string[], uid: string) {
  const key = getUserCourseRequestKey(uid, courseIds)
  return runSingleFlight(visibleActivityRequests, key, () =>
    loadActivitiesVisibleToUserByCourseIds(courseIds, uid)
  )
}

async function loadMaterialsVisibleToUserByCourseIds(
  courseIds: string[],
  uid: string
): Promise<Material[]> {
  const firestore = getDbOrThrow()
  const chunks = chunkArray(courseIds)
  const deduped = new Map<string, Material>()

  const loadChunk = async (idsChunk: string[]) => {
    try {
      const publicSnapshot = await getDocs(
        query(
          collection(firestore, COLLECTIONS.materials),
          where("courseId", "in", idsChunk),
          where("visibility", "==", "module")
        )
      )
      publicSnapshot.docs.forEach((docSnap) => {
        const data = docSnap.data()
        deduped.set(docSnap.id, {
          id: docSnap.id,
          activityId: data.activityId ?? undefined,
          courseId: data.courseId ?? undefined,
          trackId: data.trackId ?? undefined,
          title: data.title ?? "",
          type: data.type ?? undefined,
          url: normalizeCloudinaryUrlValue(data.url ?? null) ?? "",
          visibility: data.visibility ?? "module",
          userIds: Array.isArray(data.userIds) ? data.userIds : [],
          releaseAt: data.releaseAt?.toDate?.() ?? null,
          markdown: data.markdown ?? "",
          attachments: normalizeCloudinaryUrlItems(
            Array.isArray(data.attachments) ? data.attachments : []
          ),
        })
      })
    } catch (error) {
      if (!isFirestorePermissionDenied(error)) {
        throw error
      }
    }

    try {
      const usersSnapshot = await getDocs(
        query(
          collection(firestore, COLLECTIONS.materials),
          where("courseId", "in", idsChunk),
          where("visibility", "==", "users"),
          where("userIds", "array-contains", uid)
        )
      )
      usersSnapshot.docs.forEach((docSnap) => {
        const data = docSnap.data()
        deduped.set(docSnap.id, {
          id: docSnap.id,
          activityId: data.activityId ?? undefined,
          courseId: data.courseId ?? undefined,
          trackId: data.trackId ?? undefined,
          title: data.title ?? "",
          type: data.type ?? undefined,
          url: normalizeCloudinaryUrlValue(data.url ?? null) ?? "",
          visibility: data.visibility ?? "module",
          userIds: Array.isArray(data.userIds) ? data.userIds : [],
          releaseAt: data.releaseAt?.toDate?.() ?? null,
          markdown: data.markdown ?? "",
          attachments: normalizeCloudinaryUrlItems(
            Array.isArray(data.attachments) ? data.attachments : []
          ),
        })
      })
    } catch (error) {
      if (!isFirestorePermissionDenied(error)) {
        throw error
      }
    }
  }

  await Promise.all(chunks.map((idsChunk) => loadChunk(idsChunk)))

  return Array.from(deduped.values())
}


function fetchMaterialsVisibleToUserByCourseIds(courseIds: string[], uid: string) {
  const key = getUserCourseRequestKey(uid, courseIds)
  return runSingleFlight(visibleMaterialRequests, key, () =>
    loadMaterialsVisibleToUserByCourseIds(courseIds, uid)
  )
}

export async function fetchUserProfile(uid: string): Promise<UserProfile | null> {
  const firestore = getDbOrThrow()

  const userRef = doc(firestore, COLLECTIONS.users, uid)
  const snapshot = await getDoc(userRef)

  if (!snapshot.exists()) {
    return null
  }

  const data = snapshot.data()

  return {
    uid: data.uid,
    name: data.name ?? "",
    email: data.email ?? "",
    role: (data.role ?? "user") as UserRole,
    team: data.team ?? null,
    disabled: data.disabled ?? false,
    isRobot: data.isRobot ?? false,
    mustChangePassword: data.mustChangePassword ?? false,
    createdAt: data.createdAt?.toDate?.() ?? null,
    updatedAt: data.updatedAt?.toDate?.() ?? null,
    photoURL: normalizeCloudinaryUrlValue(data.photoURL ?? null) ?? null,
    notificationPreferences: {
      activityUpdates: data.notificationPreferences?.activityUpdates ?? true,
      gradesAndFeedback: data.notificationPreferences?.gradesAndFeedback ?? true,
      weeklySummary: data.notificationPreferences?.weeklySummary ?? false,
      marketing: data.notificationPreferences?.marketing ?? false,
    },
  } satisfies UserProfile
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>) {
  const firestore = getDbOrThrow()
  const userRef = doc(firestore, COLLECTIONS.users, uid)
  await setDoc(
    userRef,
    {
      ...data,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  )
}



export async function updateUserNotificationPreferences(
  uid: string,
  preferences: NotificationPreferences
) {
  await updateUserProfile(uid, { notificationPreferences: preferences })
}

export async function createSupportTicket(params: {
  uid: string
  subject: string
  message: string
}) {
  const firestore = getDbOrThrow()
  const ticketRef = doc(collection(firestore, COLLECTIONS.supportTickets))
  const now = serverTimestamp()

  await setDoc(ticketRef, {
    userId: params.uid,
    subject: params.subject,
    message: params.message,
    status: "open",
    createdAt: now,
    updatedAt: now,
  })

  return ticketRef.id
}

export async function fetchUserSupportTickets(uid: string): Promise<SupportTicket[]> {
  const firestore = getDbOrThrow()
  const snapshot = await getDocs(
    query(
      collection(firestore, COLLECTIONS.supportTickets),
      where("userId", "==", uid)
    )
  )

  return snapshot.docs
    .map((docSnap) => {
      const data = docSnap.data()
      return {
        id: docSnap.id,
        userId: typeof data.userId === "string" ? data.userId : uid,
        subject: typeof data.subject === "string" ? data.subject : "",
        message: typeof data.message === "string" ? data.message : "",
        status: data.status === "resolved" ? "resolved" : "open",
        createdAt: data.createdAt?.toDate?.() ?? null,
        updatedAt: data.updatedAt?.toDate?.() ?? null,
      } satisfies SupportTicket
    })
    .sort(
      (left, right) =>
        (right.createdAt?.getTime() ?? 0) - (left.createdAt?.getTime() ?? 0)
    )
}

export async function setUserMustChangePassword(params: {
  uid: string
  value: boolean
}) {
  const firestore = getDbOrThrow()
  const userRef = doc(firestore, COLLECTIONS.users, params.uid)
  await setDoc(
    userRef,
    {
      mustChangePassword: params.value,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  )
}

function mapCourseSnapshot(courseSnap: { id: string; data: () => Record<string, unknown> }): Course {
  const data = courseSnap.data()
  return {
    id: courseSnap.id,
    title: (data.title as string | undefined) ?? "",
    description: (data.description as string | undefined) ?? "",
    level: (data.level as Course["level"] | undefined) ?? "Beginner",
    durationWeeks: Number(data.durationWeeks ?? 0),
    coverUrl: normalizeCloudinaryUrlValue(readStringField(data.coverUrl)) ?? undefined,
  }
}

async function fetchCoursesByIds(courseIds: string[]): Promise<Course[]> {
  const firestore = getDbOrThrow()
  const chunks = chunkArray(courseIds)

  const loadChunk = async (idsChunk: string[]) => {
    try {
      const snapshot = await getDocs(
        query(
          collection(firestore, COLLECTIONS.courses),
          where(documentId(), "in", idsChunk)
        )
      )
      return snapshot.docs.map(mapCourseSnapshot)
    } catch (error) {
      if (!isFirestorePermissionDenied(error)) {
        throw error
      }

      const fallback = await Promise.all(
        idsChunk.map(async (courseId): Promise<Course | null> => {
          try {
            const snapshot = await getDoc(
              doc(firestore, COLLECTIONS.courses, courseId)
            )
            return snapshot.exists() ? mapCourseSnapshot(snapshot) : null
          } catch (fallbackError) {
            if (isFirestorePermissionDenied(fallbackError)) {
              return null
            }
            throw fallbackError
          }
        })
      )

      return fallback.filter((course): course is Course => course !== null)
    }
  }

  return (await Promise.all(chunks.map(loadChunk))).flat()
}

function groupByCourseId<T extends { courseId: string }>(items: T[]) {
  const grouped = new Map<string, T[]>()
  items.forEach((item) => {
    const entries = grouped.get(item.courseId)
    if (entries) {
      entries.push(item)
    } else {
      grouped.set(item.courseId, [item])
    }
  })
  return grouped
}

export async function fetchUserDashboard(uid: string): Promise<DashboardCourse[]> {
  const now = new Date()
  const enrollments = await fetchEnrollmentsWithTrackFallback(uid)

  if (!enrollments.length) {
    return []
  }

  const courseIds = getEnrollmentCourseIds(enrollments)
  const [courses, tracks, activities] = await Promise.all([
    fetchCoursesByIds(courseIds),
    fetchTracksVisibleToUserByCourseIds(courseIds, uid),
    fetchActivitiesVisibleToUserByCourseIds(courseIds, uid),
  ])

  const courseById = new Map(courses.map((course) => [course.id, course] as const))
  const tracksByCourseId = groupByCourseId(tracks)
  const activitiesByCourseId = groupByCourseId(activities)

  const dashboardCourses = enrollments.map(
    (enrollment): DashboardCourse | null => {
      const course = courseById.get(enrollment.courseId)
      if (!course) {
        return null
      }
      const courseTracks = (tracksByCourseId.get(enrollment.courseId) ?? [])
        .filter(
          (track) =>
            !track.userIds?.length || track.userIds?.includes(enrollment.userId)
        )
        .sort((a, b) => a.order - b.order)
      const availableTrackIds = new Set(courseTracks.map((track) => track.id))
      const courseActivities = (activitiesByCourseId.get(enrollment.courseId) ?? [])
        .filter((activity) => availableTrackIds.has(activity.trackId))
        .filter((activity) =>
          isContentAvailableToUser(activity, enrollment.userId, now)
        )
        .sort((a, b) => a.order - b.order)

      return {
        ...course,
        enrollment,
        tracks: courseTracks,
        activities: courseActivities,
      } satisfies DashboardCourse
    }
  )

  return dashboardCourses.filter(
    (item): item is DashboardCourse => item !== null
  )
}

export async function fetchUserMaterials(uid: string): Promise<Material[]> {
  const now = new Date()
  const enrollments = await fetchEnrollmentsWithTrackFallback(uid)

  if (!enrollments.length) {
    return []
  }

  const courseIds = getEnrollmentCourseIds(enrollments)
  const tracks = await fetchTracksVisibleToUserByCourseIds(courseIds, uid)
  const availableTrackIds = new Set(tracks.map((track) => track.id))
  const materials = await fetchMaterialsVisibleToUserByCourseIds(courseIds, uid)

  return materials
    .filter((material) =>
      material.trackId ? availableTrackIds.has(material.trackId) : true
    )
    .filter((material) => isContentAvailableToUser(material, uid, now))
    .sort((a, b) => a.title.localeCompare(b.title))
}

export async function fetchUserActivities(uid: string): Promise<Activity[]> {
  const now = new Date()
  const enrollments = await fetchEnrollmentsWithTrackFallback(uid)

  if (!enrollments.length) {
    return []
  }

  const courseIds = getEnrollmentCourseIds(enrollments)
  const tracks = await fetchTracksVisibleToUserByCourseIds(courseIds, uid)
  const availableTrackIds = new Set(tracks.map((track) => track.id))
  const activities = await fetchActivitiesVisibleToUserByCourseIds(courseIds, uid)

  return activities
    .filter((activity) => availableTrackIds.has(activity.trackId))
    .filter((activity) => isContentAvailableToUser(activity, uid, now))
    .sort((a, b) => a.order - b.order)
}

function mapActivityProgress(docId: string, data: Record<string, unknown>): ActivityProgress {
  return {
    id: docId,
    userId: readStringField(data.userId),
    activityId: readStringField(data.activityId),
    courseId: readStringField(data.courseId),
    trackId: readStringField(data.trackId),
    status: (data.status ?? "not_started") as ActivityProgressStatus,
    answers:
      data.answers && typeof data.answers === "object"
        ? (data.answers as Record<string, ActivityAnswerValue>)
        : {},
    answeredCount: Number(data.answeredCount ?? 0),
    totalQuestions: Number(data.totalQuestions ?? 0),
    completionPercent: Number(data.completionPercent ?? 0),
    scorePercent:
      typeof data.scorePercent === "number" ? Number(data.scorePercent) : null,
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
    gradedAt: data.gradedAt && typeof data.gradedAt === "object" && "toDate" in data.gradedAt
      ? (data.gradedAt as { toDate: () => Date }).toDate()
      : null,
    submittedAt: data.submittedAt && typeof data.submittedAt === "object" && "toDate" in data.submittedAt
      ? (data.submittedAt as { toDate: () => Date }).toDate()
      : null,
    createdAt: data.createdAt && typeof data.createdAt === "object" && "toDate" in data.createdAt
      ? (data.createdAt as { toDate: () => Date }).toDate()
      : null,
    updatedAt: data.updatedAt && typeof data.updatedAt === "object" && "toDate" in data.updatedAt
      ? (data.updatedAt as { toDate: () => Date }).toDate()
      : null,
  }
}

export async function fetchUserActivityProgress(uid: string, activityId: string): Promise<ActivityProgress | null> {
  const firestore = getDbOrThrow()
  const docId = `${uid}_${activityId}`
  const ref = doc(firestore, COLLECTIONS.activityProgress, docId)
  let snapshot
  try {
    snapshot = await getDoc(ref)
  } catch (error) {
    if (isFirestorePermissionDenied(error)) {
      return null
    }
    throw error
  }

  if (!snapshot.exists()) {
    return null
  }

  const data = snapshot.data() as Record<string, unknown>
  return mapActivityProgress(snapshot.id, data)
}

async function loadUserActivityProgressList(uid: string): Promise<ActivityProgress[]> {
  const firestore = getDbOrThrow()
  let snapshot
  try {
    snapshot = await getDocs(
      query(
        collection(firestore, COLLECTIONS.activityProgress),
        where("userId", "==", uid)
      )
    )
  } catch (error) {
    if (isFirestorePermissionDenied(error)) {
      return []
    }
    throw error
  }

  return snapshot.docs
    .map((docSnap) =>
      mapActivityProgress(docSnap.id, docSnap.data() as Record<string, unknown>)
    )
    .sort((a, b) => {
      const left = a.updatedAt?.getTime() ?? 0
      const right = b.updatedAt?.getTime() ?? 0
      return right - left
    })
}

export function fetchUserActivityProgressList(uid: string): Promise<ActivityProgress[]> {
  return runSingleFlight(activityProgressListRequests, uid, () =>
    loadUserActivityProgressList(uid)
  )
}

export async function upsertUserActivityProgress(params: {
  uid: string
  activityId: string
  courseId: string
  trackId: string
  status: ActivityProgressStatus
  answers: Record<string, ActivityAnswerValue>
  answeredCount: number
  totalQuestions: number
  completionPercent: number
  scorePercent: number | null
  markSubmitted: boolean
}) {
  const firestore = getDbOrThrow()
  const docId = `${params.uid}_${params.activityId}`
  const ref = doc(firestore, COLLECTIONS.activityProgress, docId)
  const snapshot = await getDoc(ref)
  const existingData = snapshot.exists() ? snapshot.data() : null
  const isRevisionResubmission =
    params.markSubmitted && existingData?.gradingStatus === "revision_requested"

  await setDoc(
    ref,
    {
      ...(snapshot.exists() ? {} : { createdAt: serverTimestamp() }),
      ...(isRevisionResubmission ? { gradingStatus: "pending" } : {}),
      userId: params.uid,
      activityId: params.activityId,
      courseId: params.courseId,
      trackId: params.trackId,
      status: params.status,
      answers: params.answers,
      answeredCount: params.answeredCount,
      totalQuestions: params.totalQuestions,
      completionPercent: params.completionPercent,
      scorePercent: params.scorePercent,
      submittedAt: params.markSubmitted ? serverTimestamp() : null,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  )
}

export async function fetchAdminOverview(): Promise<AdminOverview> {
  const firestore = getDbOrThrow()
  const [usersSnapshot, coursesSnapshot] = await Promise.all([
    getCountFromServer(collection(firestore, COLLECTIONS.users)),
    getCountFromServer(collection(firestore, COLLECTIONS.courses)),
  ])

  return {
    usersCount: usersSnapshot.data().count,
    coursesCount: coursesSnapshot.data().count,
  }
}
