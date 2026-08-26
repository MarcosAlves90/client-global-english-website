import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import { adminDb } from "@/lib/firebase/admin"
import { assertHasRole } from "@/lib/firebase/admin-request"
import { COLLECTIONS } from "@/lib/firebase/collections"
import { canManageCourseAsTeacher } from "@/lib/firebase/teacher-access"
import type { AdminUserSummary, UserRole } from "@/lib/firebase/types"
import { buildAdminCourseSummaries } from "@/modules/courses/server/admin-course-summary"

function readDate(value: unknown) {
  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (value as { toDate?: unknown }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate()
  }
  return null
}

function mapStudent(docSnap: {
  id: string
  exists: boolean
  data: () => Record<string, unknown> | undefined
}): AdminUserSummary | null {
  if (!docSnap.exists) return null
  const data = docSnap.data() ?? {}
  const role: UserRole =
    data.role === "teacher" || data.role === "admin" ? data.role : "user"

  return {
    uid: docSnap.id,
    name: typeof data.name === "string" ? data.name : "",
    email: typeof data.email === "string" ? data.email : "",
    role,
    team: typeof data.team === "string" ? data.team : null,
    disabled: Boolean(data.disabled),
    isRobot: Boolean(data.isRobot),
    photoURL: typeof data.photoURL === "string" ? data.photoURL : null,
    createdAt: readDate(data.createdAt),
    updatedAt: readDate(data.updatedAt),
  }
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ courseId: string }> }
) {
  const authCheck = await assertHasRole(req, ["teacher", "admin"])
  if (!authCheck.ok) {
    return NextResponse.json({ error: authCheck.message }, { status: authCheck.status })
  }

  const { courseId: rawCourseId } = await context.params
  const courseId = rawCourseId?.trim()
  if (!courseId) {
    return NextResponse.json({ error: "courseId is required" }, { status: 400 })
  }

  if (!(await canManageCourseAsTeacher({ ...authCheck, courseId }))) {
    return NextResponse.json({ error: "Course access denied" }, { status: 403 })
  }

  try {
    const courseRef = adminDb.collection(COLLECTIONS.courses).doc(courseId)
    const [courseSnapshot, tracksSnapshot, enrollmentsSnapshot, activitiesSnapshot] = await Promise.all([
      courseRef.get(),
      adminDb.collection(COLLECTIONS.tracks).where("courseId", "==", courseId).get(),
      adminDb.collection(COLLECTIONS.enrollments).where("courseId", "==", courseId).get(),
      adminDb.collection(COLLECTIONS.activities).where("courseId", "==", courseId).get(),
    ])

    if (!courseSnapshot.exists) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    const course = buildAdminCourseSummaries({
      courses: [courseSnapshot],
      tracks: tracksSnapshot.docs,
      enrollments: enrollmentsSnapshot.docs,
      activities: activitiesSnapshot.docs,
    })[0]

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    const studentIds = Array.from(
      new Set(
        enrollmentsSnapshot.docs
          .map((item) => item.data()?.userId)
          .filter((value): value is string => typeof value === "string" && Boolean(value.trim()))
          .map((value) => value.trim())
      )
    )

    const studentSnapshots = studentIds.length
      ? await adminDb.getAll(
          ...studentIds.map((uid) => adminDb.collection(COLLECTIONS.users).doc(uid))
        )
      : []

    const students = studentSnapshots
      .map(mapStudent)
      .filter((item): item is AdminUserSummary => item !== null)
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" }))

    const tracks = tracksSnapshot.docs
      .map((docSnap) => {
        const data = docSnap.data() ?? {}
        return {
          id: docSnap.id,
          courseId,
          title: typeof data.title === "string" ? data.title : "",
          description: typeof data.description === "string" ? data.description : "",
          order: Number(data.order ?? 0),
          userIds: Array.isArray(data.userIds)
            ? data.userIds.filter((value): value is string => typeof value === "string")
            : [],
        }
      })
      .sort((a, b) => a.order - b.order)

    const activities = activitiesSnapshot.docs
      .map((docSnap) => {
        const data = docSnap.data() ?? {}
        return {
          id: docSnap.id,
          courseId,
          trackId: typeof data.trackId === "string" ? data.trackId : "",
          title: typeof data.title === "string" ? data.title : "",
          type:
            data.type === "quiz" || data.type === "assignment" || data.type === "project"
              ? data.type
              : "lesson",
          order: Number(data.order ?? 0),
          estimatedMinutes: Number(data.estimatedMinutes ?? 0),
          visibility:
            data.visibility === "module" || data.visibility === "users" || data.visibility === "private"
              ? data.visibility
              : "private",
          userIds: Array.isArray(data.userIds)
            ? data.userIds.filter((value): value is string => typeof value === "string")
            : [],
          releaseAt: readDate(data.releaseAt),
          dueAt: readDate(data.dueAt),
          closeAt: readDate(data.closeAt),
          attachments: Array.isArray(data.attachments) ? data.attachments : [],
          questions: Array.isArray(data.questions) ? data.questions : [],
        }
      })
      .sort((a, b) => a.order - b.order)

    return NextResponse.json({ course, tracks, students, activities })
  } catch (error) {
    console.error("teacher course workspace failed", error)
    return NextResponse.json({ error: "Could not load teacher course workspace" }, { status: 500 })
  }
}
