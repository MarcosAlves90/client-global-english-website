import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import { adminAuth, adminDb } from "@/lib/firebase/admin"
import { COLLECTIONS } from "@/lib/firebase/collections"
import type { AdminActivityResponse } from "@/lib/firebase/types"

async function assertIsAdmin(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  const token = authHeader?.split(" ")[1]
  if (!token) {
    return { ok: false, status: 401, message: "Missing auth token" }
  }

  try {
    const decoded = await adminAuth.verifyIdToken(token)
    const doc = await adminDb.collection(COLLECTIONS.users).doc(decoded.uid).get()
    const data = doc.data()

    if (data?.role === "admin") {
      return { ok: true, uid: decoded.uid }
    }

    return { ok: false, status: 403, message: "Admin access required" }
  } catch (err) {
    console.error("token verification failed", err)
    return { ok: false, status: 401, message: "Invalid auth token" }
  }
}

export async function GET(req: NextRequest) {
  const authCheck = await assertIsAdmin(req)
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

  try {
    let progressQuery: FirebaseFirestore.Query = adminDb
      .collection(COLLECTIONS.activityProgress)
      .where("courseId", "==", courseId)

    if (activityId) {
      progressQuery = progressQuery.where("activityId", "==", activityId)
    }

    const progressSnapshot = await progressQuery.get()

    const userIds = Array.from(
      new Set(
        progressSnapshot.docs
          .map((docSnap) => {
            const value = docSnap.data()?.userId
            return typeof value === "string" ? value : ""
          })
          .filter(Boolean)
      )
    )

    const userDocs = await Promise.all(
      userIds.map((uid) =>
        adminDb.collection(COLLECTIONS.users).doc(uid).get()
      )
    )

    const userById = new Map(
      userDocs
        .filter((docSnap) => docSnap.exists)
        .map((docSnap) => {
          const data = docSnap.data() ?? {}
          return [
            docSnap.id,
            {
              uid: docSnap.id,
              name: typeof data.name === "string" ? data.name : "",
              email: typeof data.email === "string" ? data.email : "",
              photoURL:
                typeof data.photoURL === "string" ? data.photoURL : null,
              isRobot: Boolean(data.isRobot),
            },
          ] as const
        })
    )

    const items: AdminActivityResponse[] = progressSnapshot.docs
      .map((docSnap) => {
        const data = docSnap.data()
        const userId = typeof data.userId === "string" ? data.userId : ""

        return {
          id: docSnap.id,
          userId,
          activityId: typeof data.activityId === "string" ? data.activityId : "",
          courseId: typeof data.courseId === "string" ? data.courseId : "",
          trackId: typeof data.trackId === "string" ? data.trackId : "",
          status:
            data.status === "completed" || data.status === "in_progress"
              ? data.status
              : "not_started",
          answers:
            data.answers && typeof data.answers === "object"
              ? (data.answers as Record<string, string | string[] | boolean | null>)
              : {},
          answeredCount: Number(data.answeredCount ?? 0),
          totalQuestions: Number(data.totalQuestions ?? 0),
          completionPercent: Number(data.completionPercent ?? 0),
          scorePercent:
            typeof data.scorePercent === "number" ? Number(data.scorePercent) : null,
          submittedAt: data.submittedAt?.toDate?.() ?? null,
          createdAt: data.createdAt?.toDate?.() ?? null,
          updatedAt: data.updatedAt?.toDate?.() ?? null,
          user: userById.get(userId),
        } satisfies AdminActivityResponse
      })
      .sort((a, b) => {
        const left = new Date(a.updatedAt ?? 0).getTime()
        const right = new Date(b.updatedAt ?? 0).getTime()
        return right - left
      })

    return NextResponse.json(items)
  } catch (err) {
    console.error("list activity progress failed", err)
    return NextResponse.json(
      { error: "Could not list activity progress" },
      { status: 500 }
    )
  }
}
