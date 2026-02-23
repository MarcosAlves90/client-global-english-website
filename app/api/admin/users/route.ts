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
    // fetch a page of auth users (max 1000 for simplicity)
    const authList = await adminAuth.listUsers(1000)
    const users: AdminUserSummary[] = []

    for (const u of authList.users) {
      const docSnap = await adminDb
        .collection(COLLECTIONS.users)
        .doc(u.uid)
        .get()
      const data = docSnap.data()
      users.push({
        uid: u.uid,
        name: u.displayName ?? "",
        email: u.email ?? "",
        role: (data?.role as UserRole) ?? "user",
        team: (data?.team as string) ?? null,
        createdAt: data?.createdAt?.toDate?.() ?? null,
        updatedAt: data?.updatedAt?.toDate?.() ?? null,
      })
    }

    users.sort((a, b) => a.name.localeCompare(b.name))
    return NextResponse.json(users)
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

  const { uid, name, email, role: roleStr, team } = body

  try {
    const authUpdates: Record<string, unknown> = {}
    if (name) authUpdates.displayName = name
    if (email) authUpdates.email = email
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
    firestoreUpdates.updatedAt = admin.firestore.FieldValue.serverTimestamp()

    await adminDb.collection(COLLECTIONS.users).doc(uid).set(firestoreUpdates, { merge: true })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("failed to patch user", err)
    return NextResponse.json({ error: "update failed" }, { status: 500 })
  }
}
