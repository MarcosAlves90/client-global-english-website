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
}

interface PaginatedUsersResponse {
  items: AdminUserSummary[]
  nextCursor: string | null
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
    const userRecord = await adminAuth.createUser({
      displayName: body.name,
      email: body.email,
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
      createdAt: null,
      updatedAt: null,
    }

    return NextResponse.json(result, { status: 201 })
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

  const { uid, name, email, role: roleStr, team, disabled } = body

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
    await adminAuth.deleteUser(body.uid)
    await adminDb.collection(COLLECTIONS.users).doc(body.uid).delete()
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("failed to delete user", err)
    return NextResponse.json({ error: "delete failed" }, { status: 500 })
  }
}
