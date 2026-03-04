import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore"
import { db, hasFirebaseConfig } from "@/lib/firebase/client"
import { COLLECTIONS } from "@/lib/firebase/collections"
import type {
  Activity,
  AdminCourseSummary,
  AdminOverview,
  AdminUserSummary,
  Course,
  DashboardCourse,
  Enrollment,
  Material,
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

async function fetchEnrollmentsWithTrackFallback(
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

async function fetchTracksVisibleToUserByCourseIds(
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

async function fetchActivitiesVisibleToUserByCourseIds(
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
          attachments: Array.isArray(data.attachments) ? data.attachments : [],
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
          attachments: Array.isArray(data.attachments) ? data.attachments : [],
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

async function fetchMaterialsVisibleToUserByCourseIds(
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
          url: data.url ?? "",
          visibility: data.visibility ?? "module",
          userIds: Array.isArray(data.userIds) ? data.userIds : [],
          releaseAt: data.releaseAt?.toDate?.() ?? null,
          markdown: data.markdown ?? "",
          attachments: Array.isArray(data.attachments) ? data.attachments : [],
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
          url: data.url ?? "",
          visibility: data.visibility ?? "module",
          userIds: Array.isArray(data.userIds) ? data.userIds : [],
          releaseAt: data.releaseAt?.toDate?.() ?? null,
          markdown: data.markdown ?? "",
          attachments: Array.isArray(data.attachments) ? data.attachments : [],
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
    mustChangePassword: data.mustChangePassword ?? false,
    createdAt: data.createdAt?.toDate?.() ?? null,
    updatedAt: data.updatedAt?.toDate?.() ?? null,
    photoURL: data.photoURL ?? null,
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

export async function fetchUserDashboard(uid: string): Promise<DashboardCourse[]> {
  const firestore = getDbOrThrow()
  const now = new Date()
  const enrollments = await fetchEnrollmentsWithTrackFallback(uid)

  if (!enrollments.length) {
    return []
  }

  const courseIds = Array.from(
    new Set(enrollments.map((enrollment) => enrollment.courseId))
  )
  const courses = (
    await Promise.all(
      courseIds.map(async (courseId): Promise<Course | null> => {
        let courseSnap
        try {
          courseSnap = await getDoc(doc(firestore, COLLECTIONS.courses, courseId))
        } catch (error) {
          if (isFirestorePermissionDenied(error)) {
            return null
          }
          throw error
        }
        if (!courseSnap.exists()) {
          return null
        }
        const data = courseSnap.data()
        return {
          id: courseSnap.id,
          title: data.title ?? "",
          description: data.description ?? "",
          level: data.level ?? "Beginner",
          durationWeeks: data.durationWeeks ?? 0,
          coverUrl: data.coverUrl ?? undefined,
        } satisfies Course
      })
    )
  ).filter((course): course is Course => course !== null)

  const [tracks, activities] = await Promise.all([
    fetchTracksVisibleToUserByCourseIds(courseIds, uid),
    fetchActivitiesVisibleToUserByCourseIds(courseIds, uid),
  ])

  const dashboardCourses = enrollments.map(
    (enrollment): DashboardCourse | null => {
      const course = courses.find((item) => item?.id === enrollment.courseId)
      if (!course) {
        return null
      }
      const courseTracks = tracks
        .filter((track) => track.courseId === enrollment.courseId)
        .filter(
          (track) =>
            !track.userIds?.length || track.userIds?.includes(enrollment.userId)
        )
        .sort((a, b) => a.order - b.order)
      const availableTrackIds = new Set(courseTracks.map((track) => track.id))
      const courseActivities = activities
        .filter((activity) => activity.courseId === enrollment.courseId)
        .filter((activity) => availableTrackIds.has(activity.trackId))
        .filter((activity) => {
          const visibility = activity.visibility ?? "module"
          if (visibility === "private") {
            return false
          }
          if (visibility === "users") {
            return activity.userIds?.includes(enrollment.userId)
          }
          return true
        })
        .filter((activity) => {
          if (!activity.releaseAt) return true
          const releaseAt =
            activity.releaseAt instanceof Date
              ? activity.releaseAt
              : new Date(activity.releaseAt)
          return releaseAt <= now
        })
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

  const courseIds = Array.from(
    new Set(enrollments.map((enrollment) => enrollment.courseId))
  )
  const tracks = await fetchTracksVisibleToUserByCourseIds(courseIds, uid)
  const availableTrackIds = new Set(tracks.map((track) => track.id))
  const materials = await fetchMaterialsVisibleToUserByCourseIds(courseIds, uid)

  return materials
    .filter((material) =>
      material.trackId ? availableTrackIds.has(material.trackId) : true
    )
    .filter((material) => {
      const visibility = material.visibility ?? "module"
      if (visibility === "private") return false
      if (visibility === "users") {
        return material.userIds?.includes(uid)
      }
      return true
    })
    .filter((material) => {
      if (!material.releaseAt) return true
      const releaseAt =
        material.releaseAt instanceof Date
          ? material.releaseAt
          : new Date(material.releaseAt)
      return releaseAt <= now
    })
    .sort((a, b) => a.title.localeCompare(b.title))
}

export async function fetchUserActivities(uid: string): Promise<Activity[]> {
  const now = new Date()
  const enrollments = await fetchEnrollmentsWithTrackFallback(uid)

  if (!enrollments.length) {
    return []
  }

  const courseIds = Array.from(
    new Set(enrollments.map((enrollment) => enrollment.courseId))
  )
  const tracks = await fetchTracksVisibleToUserByCourseIds(courseIds, uid)
  const availableTrackIds = new Set(tracks.map((track) => track.id))
  const activities = await fetchActivitiesVisibleToUserByCourseIds(courseIds, uid)

  return activities
    .filter((activity) => availableTrackIds.has(activity.trackId))
    .filter((activity) => {
      const visibility = activity.visibility ?? "module"
      if (visibility === "private") return false
      if (visibility === "users") {
        return activity.userIds?.includes(uid)
      }
      return true
    })
    .filter((activity) => {
      if (!activity.releaseAt) return true
      const releaseAt =
        activity.releaseAt instanceof Date
          ? activity.releaseAt
          : new Date(activity.releaseAt)
      return releaseAt <= now
    })
    .sort((a, b) => a.order - b.order)
}

export async function fetchAdminUsers(): Promise<AdminUserSummary[]> {
  const firestore = getDbOrThrow()
  const snapshot = await getDocs(collection(firestore, COLLECTIONS.users))

  return snapshot.docs
    .map((docSnap) => {
      const data = docSnap.data()
      return {
        uid: data.uid ?? docSnap.id,
        name: data.name ?? "",
        email: data.email ?? "",
        role: (data.role ?? "user") as UserRole,
        team: data.team ?? null,
        createdAt: data.createdAt?.toDate?.() ?? null,
        updatedAt: data.updatedAt?.toDate?.() ?? null,
      } satisfies AdminUserSummary
    })
    .sort((a, b) => a.name.localeCompare(b.name))
}

export async function updateAdminUser(params: {
  uid: string
  name: string
  email: string
  role: UserRole
  team?: string | null
}) {
  const firestore = getDbOrThrow()
  const userRef = doc(firestore, COLLECTIONS.users, params.uid)

  await setDoc(
    userRef,
    {
      uid: params.uid,
      name: params.name,
      email: params.email,
      role: params.role,
      team: params.team ?? null,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  )
}

export async function fetchAdminCourses(): Promise<AdminCourseSummary[]> {
  const firestore = getDbOrThrow()
  const coursesSnapshot = await getDocs(
    collection(firestore, COLLECTIONS.courses)
  )

  const courseBase = coursesSnapshot.docs.map((docSnap) => {
    const data = docSnap.data()
    return {
      id: docSnap.id,
      title: data.title ?? "",
      description: data.description ?? "",
      level: (data.level ?? "Beginner") as "Beginner" | "Intermediate" | "Advanced",
      durationWeeks: data.durationWeeks ?? 0,
      coverUrl: data.coverUrl ?? null,
      status: data.status ?? "Inscrições abertas",
    }
  })

  const courses = await Promise.all(
    courseBase.map(async (course) => {
      const [tracksSnapshot, enrollmentsSnapshot, activitiesSnapshot] =
        await Promise.all([
          getDocs(
            query(
              collection(firestore, COLLECTIONS.tracks),
              where("courseId", "==", course.id)
            )
          ),
          getDocs(
            query(
              collection(firestore, COLLECTIONS.enrollments),
              where("courseId", "==", course.id)
            )
          ),
          getDocs(
            query(
              collection(firestore, COLLECTIONS.activities),
              where("courseId", "==", course.id)
            )
          ),
        ])

      const trackUserIds = new Set<string>()
      tracksSnapshot.docs.forEach((trackSnap) => {
        const data = trackSnap.data()
        const ids = Array.isArray(data.userIds) ? data.userIds : []
        ids.forEach((id: string) => {
          if (typeof id === "string" && id.trim()) {
            trackUserIds.add(id)
          }
        })
      })

      const enrollmentUserIds = new Set<string>()
      enrollmentsSnapshot.docs.forEach((enrollmentSnap) => {
        const data = enrollmentSnap.data()
        const id = data.userId
        if (typeof id === "string" && id.trim()) {
          enrollmentUserIds.add(id)
        }
      })

      const studentsCount = new Set([
        ...trackUserIds.values(),
        ...enrollmentUserIds.values(),
      ]).size

      return {
        id: course.id,
        title: course.title,
        description: course.description,
        level: course.level,
        durationWeeks: course.durationWeeks,
        coverUrl: course.coverUrl,
        status: course.status,
        modulesCount: tracksSnapshot.size,
        studentsCount,
        activitiesCount: activitiesSnapshot.size,
      } satisfies AdminCourseSummary
    })
  )

  return courses.sort((a, b) => a.title.localeCompare(b.title))
}

export async function fetchAdminOverview(): Promise<AdminOverview> {
  const firestore = getDbOrThrow()
  const [usersSnapshot, coursesSnapshot] = await Promise.all([
    getDocs(collection(firestore, COLLECTIONS.users)),
    getDocs(collection(firestore, COLLECTIONS.courses)),
  ])

  return {
    usersCount: usersSnapshot.size,
    coursesCount: coursesSnapshot.size,
  }
}
