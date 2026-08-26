import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import { assertIsAdmin } from "@/lib/firebase/admin-request"
import { listActivityProgress } from "@/modules/activities/server/activity-progress"

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
    return NextResponse.json(
      await listActivityProgress({ courseId, activityId: activityId || undefined })
    )
  } catch (err) {
    console.error("list activity progress failed", err)
    return NextResponse.json(
      { error: "Could not list activity progress" },
      { status: 500 }
    )
  }
}
