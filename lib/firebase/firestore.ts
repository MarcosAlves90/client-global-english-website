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
import { resolveUserRole } from "@/lib/firebase/roles"
import type {
  Activity,
  AdminCourseSummary,
  AdminOverview,
  AdminUserSummary,
  Course,
  DashboardCourse,
  Enrollment,
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

export async function ensureUserProfile(params: {
  uid: string
  name: string
  email: string
  role?: UserRole
}) {
  const firestore = getDbOrThrow()

  const userRef = doc(firestore, COLLECTIONS.users, params.uid)
  const snapshot = await getDoc(userRef)

  const existingRole = snapshot.exists()
    ? ((snapshot.data().role ?? "user") as UserRole)
    : null
  const resolvedRole = resolveUserRole({
    email: params.email,
    existingRole: params.role ?? existingRole,
  })

  await setDoc(
    userRef,
    {
      uid: params.uid,
      name: params.name,
      email: params.email,
      role: resolvedRole,
      createdAt: snapshot.exists()
        ? snapshot.data().createdAt ?? serverTimestamp()
        : serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
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
    createdAt: data.createdAt?.toDate?.() ?? null,
    updatedAt: data.updatedAt?.toDate?.() ?? null,
  } satisfies UserProfile
}

export async function fetchUserDashboard(uid: string): Promise<DashboardCourse[]> {
  const firestore = getDbOrThrow()

  const enrollmentQuery = query(
    collection(firestore, COLLECTIONS.enrollments),
    where("userId", "==", uid)
  )

  const enrollmentSnapshots = await getDocs(enrollmentQuery)
  const enrollments: Enrollment[] = enrollmentSnapshots.docs.map((docSnap) => {
    const data = docSnap.data()
    return {
      id: docSnap.id,
      userId: data.userId,
      courseId: data.courseId,
      status: data.status ?? "active",
      progress: data.progress ?? 0,
    }
  })

  if (!enrollments.length) {
    return []
  }

  const courseIds = enrollments.map((enrollment) => enrollment.courseId)
  const courses = await Promise.all(
    courseIds.map(async (courseId): Promise<Course | null> => {
      const courseSnap = await getDoc(doc(firestore, COLLECTIONS.courses, courseId))
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

  const tracksQuery = query(
    collection(firestore, COLLECTIONS.tracks),
    where("courseId", "in", courseIds)
  )
  const trackSnapshots = await getDocs(tracksQuery)
  const tracks: Track[] = trackSnapshots.docs.map((docSnap) => {
    const data = docSnap.data()
    return {
      id: docSnap.id,
      courseId: data.courseId,
      title: data.title ?? "",
      description: data.description ?? "",
      order: data.order ?? 0,
    }
  })

  const activitiesQuery = query(
    collection(firestore, COLLECTIONS.activities),
    where("courseId", "in", courseIds)
  )
  const activitySnapshots = await getDocs(activitiesQuery)
  const activities: Activity[] = activitySnapshots.docs.map((docSnap) => {
    const data = docSnap.data()
    return {
      id: docSnap.id,
      courseId: data.courseId,
      trackId: data.trackId,
      title: data.title ?? "",
      type: data.type ?? "lesson",
      order: data.order ?? 0,
      estimatedMinutes: data.estimatedMinutes ?? 0,
    }
  })

  const dashboardCourses = enrollments.map(
    (enrollment): DashboardCourse | null => {
      const course = courses.find((item) => item?.id === enrollment.courseId)
      if (!course) {
        return null
      }
      const courseTracks = tracks
        .filter((track) => track.courseId === enrollment.courseId)
        .sort((a, b) => a.order - b.order)
      const courseActivities = activities
        .filter((activity) => activity.courseId === enrollment.courseId)
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

      return {
        id: course.id,
        title: course.title,
        description: course.description,
        level: course.level,
        durationWeeks: course.durationWeeks,
        coverUrl: course.coverUrl,
        status: course.status,
        modulesCount: tracksSnapshot.size,
        studentsCount: enrollmentsSnapshot.size,
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

