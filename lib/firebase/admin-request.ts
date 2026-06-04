import type { NextRequest } from "next/server"

import { adminAuth, adminDb } from "@/lib/firebase/admin"
import { COLLECTIONS } from "@/lib/firebase/collections"

export type AdminAuthCheck =
  | { ok: true; uid: string }
  | { ok: false; status: 401 | 403; message: string }

export async function assertIsAdmin(req: NextRequest): Promise<AdminAuthCheck> {
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
