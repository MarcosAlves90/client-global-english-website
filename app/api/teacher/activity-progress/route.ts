import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import admin, { adminDb } from "@/lib/firebase/admin"
import { assertHasRole } from "@/lib/firebase/admin-request"
import { COLLECTIONS } from "@/lib/firebase/collections"
import { canManageCourseAsTeacher } from "@/lib/firebase/teacher-access"
import { teacherGradeBodySchema } from "@/lib/contracts/admin"
import {
  validateTeacherGradeDraft,
  validateTeacherRevisionRequest,
} from "@/lib/activities/grading"
import { listActivityProgress } from "@/modules/activities/server/activity-progress"

export async function GET(req: NextRequest) {
  const authCheck = await assertHasRole(req, ["teacher", "admin"])
  if (!authCheck.ok) {
    return NextResponse.json(
      { error: authCheck.message },
      { status: authCheck.status }
    )
  }

  const { searchParams } = new URL(req.url)
  const courseId = searchParams.get("courseId")?.trim()
  const activityId = searchParams.get("activityId")?.trim()
  if (!courseId) {
    return NextResponse.json({ error: "courseId is required" }, { status: 400 })
  }

  if (!(await canManageCourseAsTeacher({ ...authCheck, courseId }))) {
    return NextResponse.json({ error: "Course access denied" }, { status: 403 })
  }

  try {
    return NextResponse.json(
      await listActivityProgress({ courseId, activityId: activityId || undefined })
    )
  } catch (error) {
    console.error("teacher activity progress list failed", error)
    return NextResponse.json(
      { error: "Could not list teacher activity progress" },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest) {
  const authCheck = await assertHasRole(req, ["teacher", "admin"])
  if (!authCheck.ok) {
    return NextResponse.json(
      { error: authCheck.message },
      { status: authCheck.status }
    )
  }

  let rawBody: unknown
  try {
    rawBody = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsedBody = teacherGradeBodySchema.safeParse(rawBody)
  if (!parsedBody.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
  const action = parsedBody.data.action ?? "grade"
  const gradeValidation =
    action === "grade" && typeof parsedBody.data.scorePercent === "number"
      ? validateTeacherGradeDraft({
          scorePercent: parsedBody.data.scorePercent,
          feedback: parsedBody.data.feedback,
        })
      : null
  const revisionValidation =
    action === "request_revision"
      ? validateTeacherRevisionRequest({ feedback: parsedBody.data.feedback })
      : null

  if (action === "grade" && (!gradeValidation || !gradeValidation.ok)) {
    return NextResponse.json(
      { error: gradeValidation && !gradeValidation.ok ? gradeValidation.message : "A nota é obrigatória." },
      { status: 400 }
    )
  }
  if (action === "request_revision" && (!revisionValidation || !revisionValidation.ok)) {
    return NextResponse.json(
      { error: revisionValidation && !revisionValidation.ok ? revisionValidation.message : "Feedback de revisão obrigatório." },
      { status: 400 }
    )
  }

  const progressRef = adminDb
    .collection(COLLECTIONS.activityProgress)
    .doc(parsedBody.data.id)
  const progressSnapshot = await progressRef.get()
  if (!progressSnapshot.exists) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 })
  }

  const progress = progressSnapshot.data() ?? {}
  const courseId = typeof progress.courseId === "string" ? progress.courseId : ""
  if (
    !courseId ||
    !(await canManageCourseAsTeacher({ ...authCheck, courseId }))
  ) {
    return NextResponse.json({ error: "Course access denied" }, { status: 403 })
  }
  if (progress.status !== "completed") {
    return NextResponse.json(
      { error: "Only submitted activities can be graded" },
      { status: 409 }
    )
  }

  try {
    const reviewPayload =
      action === "request_revision"
        ? {
            status: "in_progress",
            gradingStatus: "revision_requested",
            teacherScorePercent: null,
            teacherFeedback: revisionValidation?.ok
              ? revisionValidation.value.feedback
              : null,
          }
        : {
            gradingStatus: "graded",
            teacherScorePercent: gradeValidation?.ok
              ? gradeValidation.value.scorePercent
              : null,
            teacherFeedback:
              gradeValidation?.ok && gradeValidation.value.feedback
                ? gradeValidation.value.feedback
                : null,
          }

    await progressRef.set(
      {
        ...reviewPayload,
        gradedBy: authCheck.uid,
        gradedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    )
    return NextResponse.json({ ok: true, action })
  } catch (error) {
    console.error("teacher activity grading failed", error)
    return NextResponse.json({ error: "Could not save grade" }, { status: 500 })
  }
}
