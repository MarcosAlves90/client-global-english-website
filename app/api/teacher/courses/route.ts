import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import { adminDb } from "@/lib/firebase/admin"
import { assertHasRole } from "@/lib/firebase/admin-request"
import { COLLECTIONS } from "@/lib/firebase/collections"
import { buildAdminCourseSummaries } from "@/modules/courses/server/admin-course-summary"

export async function GET(req: NextRequest) {
  const authCheck = await assertHasRole(req, ["teacher", "admin"])
  if (!authCheck.ok) {
    return NextResponse.json(
      { error: authCheck.message },
      { status: authCheck.status }
    )
  }

  try {
    const courseQuery =
      authCheck.role === "admin"
        ? adminDb.collection(COLLECTIONS.courses)
        : adminDb
            .collection(COLLECTIONS.courses)
            .where("teacherIds", "array-contains", authCheck.uid)
    const coursesSnapshot = await courseQuery.get()

    if (coursesSnapshot.empty) {
      return NextResponse.json([])
    }

    const courseIds = new Set(coursesSnapshot.docs.map((course) => course.id))
    const [tracksSnapshot, enrollmentsSnapshot, activitiesSnapshot] = await Promise.all([
      adminDb.collection(COLLECTIONS.tracks).get(),
      adminDb.collection(COLLECTIONS.enrollments).get(),
      adminDb.collection(COLLECTIONS.activities).get(),
    ])

    return NextResponse.json(
      buildAdminCourseSummaries({
        courses: coursesSnapshot.docs,
        tracks: tracksSnapshot.docs.filter((item) =>
          courseIds.has(String(item.data().courseId ?? ""))
        ),
        enrollments: enrollmentsSnapshot.docs.filter((item) =>
          courseIds.has(String(item.data().courseId ?? ""))
        ),
        activities: activitiesSnapshot.docs.filter((item) =>
          courseIds.has(String(item.data().courseId ?? ""))
        ),
      })
    )
  } catch (error) {
    console.error("teacher course list failed", error)
    return NextResponse.json({ error: "Could not list teacher courses" }, { status: 500 })
  }
}
