import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import admin, { adminAuth, adminDb } from "@/lib/firebase/admin"
import { COLLECTIONS } from "@/lib/firebase/collections"
import { resolveUserRole } from "@/lib/firebase/roles"
import type { AdminUserSummary, UserRole } from "@/lib/firebase/types"

// body type used by both create and update handlers
interface RequestBody {
  name?: string
  email?: string
  role?: "user" | "admin"
  team?: string | null
  disabled?: boolean
  isRobot?: boolean
}

interface PaginatedUsersResponse {
  items: AdminUserSummary[]
  nextCursor: string | null
}

function generateInitialPassword() {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ"
  const lower = "abcdefghijkmnopqrstuvwxyz"
  const numbers = "23456789"
  const symbols = "!@#$%^&*"
  const all = `${upper}${lower}${numbers}${symbols}`
  const length = 12

  const picks = [
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
    numbers[Math.floor(Math.random() * numbers.length)],
    symbols[Math.floor(Math.random() * symbols.length)],
  ]

  while (picks.length < length) {
    picks.push(all[Math.floor(Math.random() * all.length)])
  }

  for (let i = picks.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[picks[i], picks[j]] = [picks[j], picks[i]]
  }

  return picks.join("")
}

// helpers
async function assertIsAdmin(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  const token = authHeader?.split(" ")[1]
  if (!token) {
    return { ok: false, status: 401, message: "Missing auth token" }
  }

  try {
    const decoded = await adminAuth.verifyIdToken(token)
    // check the user's role in firestore
    const doc = await adminDb
      .collection(COLLECTIONS.users)
      .doc(decoded.uid)
      .get()
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

// list all admin users; name comes from auth
export async function GET(req: NextRequest) {
  const authCheck = await assertIsAdmin(req)
  if (!authCheck.ok) {
    return NextResponse.json({ error: authCheck.message }, { status: authCheck.status })
  }

  try {
    const { searchParams } = new URL(req.url)
    const pageSizeRaw = Number(searchParams.get("pageSize") ?? "12")
    const pageSize = Number.isFinite(pageSizeRaw)
      ? Math.min(Math.max(Math.floor(pageSizeRaw), 1), 50)
      : 12
    const cursor = searchParams.get("cursor")

    let usersQuery = adminDb
      .collection(COLLECTIONS.users)
      .where("uid", "!=", authCheck.uid)
      .orderBy("uid")
      .limit(pageSize + 1)

    if (cursor) {
      usersQuery = usersQuery.startAfter(cursor)
    }

    const usersSnapshot = await usersQuery.get()
    const userDocs = usersSnapshot.docs.slice(0, pageSize)
    const hasMore = usersSnapshot.docs.length > pageSize

    const authUsersResult = await adminAuth.getUsers(
      userDocs.map((docSnap) => ({ uid: docSnap.id }))
    )

    const authUsersByUid = new Map(
      authUsersResult.users.map((u) => [u.uid, u])
    )

    const items: AdminUserSummary[] = userDocs.map((docSnap) => {
      const data = docSnap.data()
      const authUser = authUsersByUid.get(docSnap.id)

      return {
        uid: docSnap.id,
        name: authUser?.displayName ?? (data?.name as string) ?? "",
        email: authUser?.email ?? (data?.email as string) ?? "",
        role: (data?.role as UserRole) ?? "user",
        team: (data?.team as string) ?? null,
        disabled: authUser?.disabled ?? Boolean(data?.disabled),
        isRobot: Boolean(data?.isRobot),
        photoURL:
          (typeof authUser?.photoURL === "string" && authUser.photoURL.trim())
            ? authUser.photoURL
            : (data?.photoURL as string | null) ?? null,
        createdAt: data?.createdAt?.toDate?.() ?? null,
        updatedAt: data?.updatedAt?.toDate?.() ?? null,
      }
    })

    const nextCursor = hasMore
      ? ((userDocs[userDocs.length - 1]?.id ?? null) as string | null)
      : null

    const payload: PaginatedUsersResponse = {
      items,
      nextCursor,
    }

    return NextResponse.json(payload)
  } catch (err) {
    console.error("list users failed", err)
    return NextResponse.json({ error: "Could not list users" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await assertIsAdmin(req)
  if (!authCheck.ok) {
    return NextResponse.json({ error: authCheck.message }, { status: authCheck.status })
  }

  let body: RequestBody

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  if (!body.name || !body.email) {
    return NextResponse.json({ error: "Name and email are required" }, { status: 400 })
  }

  try {
    const initialPassword = generateInitialPassword()
    const userRecord = await adminAuth.createUser({
      displayName: body.name,
      email: body.email,
      password: initialPassword,
    })

    const role = resolveUserRole({
      email: body.email,
      existingRole: body.role && (body.role === "admin" ? "admin" : "user"),
    })

    const userDoc = {
      uid: userRecord.uid,
      name: body.name,
      email: body.email,
      role,
      team: body.team ?? null,
      isRobot: Boolean(body.isRobot),
      mustChangePassword: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }

    await adminDb
      .collection(COLLECTIONS.users)
      .doc(userRecord.uid)
      .set(userDoc)

    // return minimal summary (timestamps null until client fetches record)
    const result: AdminUserSummary = {
      uid: userRecord.uid,
      name: body.name,
      email: body.email,
      role,
      team: body.team ?? null,
      disabled: false,
      isRobot: Boolean(body.isRobot),
      photoURL: null,
      createdAt: null,
      updatedAt: null,
    }

    return NextResponse.json(
      { ...result, initialPassword },
      { status: 201 }
    )
  } catch (err: unknown) {
    console.error("failed to create user", err)
    const message =
      err && typeof err === "object" && "message" in err
        ? (err as { message?: string }).message
        : "unknown error"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

// update existing user; also updates auth displayName/email + firestore metadata
export async function PATCH(req: NextRequest) {
  const authCheck = await assertIsAdmin(req)
  if (!authCheck.ok) {
    return NextResponse.json({ error: authCheck.message }, { status: authCheck.status })
  }

  let body: RequestBody & { uid?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  if (!body.uid) {
    return NextResponse.json({ error: "uid is required" }, { status: 400 })
  }

  const { uid, name, email, role: roleStr, team, disabled, isRobot } = body

  try {
    const authUpdates: Record<string, unknown> = {}
    if (name) authUpdates.displayName = name
    if (email) authUpdates.email = email
    if (disabled !== undefined) authUpdates.disabled = disabled
    if (Object.keys(authUpdates).length) {
      await adminAuth.updateUser(uid, authUpdates)
    }

    const firestoreUpdates: Record<string, unknown> = {}
    if (name) firestoreUpdates.name = name
    if (email) firestoreUpdates.email = email
    if (roleStr) {
      firestoreUpdates.role = resolveUserRole({
        email: email ?? undefined,
        existingRole: roleStr as UserRole,
      })
    }
    if (team !== undefined) firestoreUpdates.team = team
    if (disabled !== undefined) {
      firestoreUpdates.disabled = disabled
    }
    if (isRobot !== undefined) {
      firestoreUpdates.isRobot = Boolean(isRobot)
    }
    firestoreUpdates.updatedAt = admin.firestore.FieldValue.serverTimestamp()

    await adminDb.collection(COLLECTIONS.users).doc(uid).set(firestoreUpdates, { merge: true })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("failed to patch user", err)
    return NextResponse.json({ error: "update failed" }, { status: 500 })
  }
}

// delete a user account and associated firestore doc
export async function DELETE(req: NextRequest) {
  const authCheck = await assertIsAdmin(req)
  if (!authCheck.ok) {
    return NextResponse.json({ error: authCheck.message }, { status: authCheck.status })
  }

  let body: { uid?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  if (!body.uid) {
    return NextResponse.json({ error: "uid is required" }, { status: 400 })
  }

  try {
    const uid = body.uid
    const batch = adminDb.batch()

    const enrollmentsSnapshot = await adminDb
      .collection(COLLECTIONS.enrollments)
      .where("userId", "==", uid)
      .get()

    enrollmentsSnapshot.docs.forEach((docSnap) => {
      batch.delete(docSnap.ref)
    })

    const tracksSnapshot = await adminDb.collection(COLLECTIONS.tracks).get()
    tracksSnapshot.docs.forEach((docSnap) => {
      const data = docSnap.data()
      const userIds = Array.isArray(data.userIds) ? data.userIds : []
      if (!userIds.includes(uid)) {
        return
      }
      const nextUserIds = userIds.filter((id: string) => id !== uid)
      batch.set(docSnap.ref, { userIds: nextUserIds }, { merge: true })
    })

    const materialsSnapshot = await adminDb.collection(COLLECTIONS.materials).get()
    materialsSnapshot.docs.forEach((docSnap) => {
      const data = docSnap.data()
      const userIds = Array.isArray(data.userIds) ? data.userIds : []
      if (!userIds.includes(uid)) {
        return
      }
      const nextUserIds = userIds.filter((id: string) => id !== uid)
      batch.set(docSnap.ref, { userIds: nextUserIds }, { merge: true })
    })

    const activitiesSnapshot = await adminDb.collection(COLLECTIONS.activities).get()
    activitiesSnapshot.docs.forEach((docSnap) => {
      const data = docSnap.data()
      const userIds = Array.isArray(data.userIds) ? data.userIds : []
      if (!userIds.includes(uid)) {
        return
      }
      const nextUserIds = userIds.filter((id: string) => id !== uid)
      batch.set(docSnap.ref, { userIds: nextUserIds }, { merge: true })
    })

    await batch.commit()

    await adminAuth.deleteUser(body.uid)
    await adminDb.collection(COLLECTIONS.users).doc(body.uid).delete()
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("failed to delete user", err)
    return NextResponse.json({ error: "delete failed" }, { status: 500 })
  }
}
