import type { NextRequest } from "next/server"

import { adminAuth, adminDb } from "@/lib/firebase/admin"
import { COLLECTIONS } from "@/lib/firebase/collections"
import type { UserRole } from "@/lib/firebase/types"

export type RoleAuthCheck =
  | { ok: true; uid: string; role: UserRole }
  | { ok: false; status: 401 | 403; message: string }

export async function assertHasRole(
  req: NextRequest,
  allowedRoles: readonly UserRole[]
): Promise<RoleAuthCheck> {
  const authHeader = req.headers.get("authorization")
  const token = authHeader?.split(" ")[1]

  if (!token) {
    return { ok: false, status: 401, message: "Missing auth token" }
  }

  try {
    const decoded = await adminAuth.verifyIdToken(token)
    const doc = await adminDb.collection(COLLECTIONS.users).doc(decoded.uid).get()
    const rawRole = doc.data()?.role
    const role: UserRole =
      rawRole === "admin" || rawRole === "teacher" ? rawRole : "user"

    if (allowedRoles.includes(role)) {
      return { ok: true, uid: decoded.uid, role }
    }

    return { ok: false, status: 403, message: "Insufficient access" }
  } catch (err) {
    console.error("token verification failed", err)
    return { ok: false, status: 401, message: "Invalid auth token" }
  }
}

export function assertIsAdmin(req: NextRequest) {
  return assertHasRole(req, ["admin"])
}
