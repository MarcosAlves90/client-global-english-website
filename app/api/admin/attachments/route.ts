import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import admin, { adminAuth, adminDb } from "@/lib/firebase/admin"
import {
  deleteCloudinaryAssetsByUrls,
  isCloudinaryUrl,
} from "@/lib/cloudinary-admin"
import { COLLECTIONS } from "@/lib/firebase/collections"

type DeleteAttachmentBody = {
  entityType?: "material" | "activity"
  entityId?: string
  attachmentUrl?: string
}

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

function resolveCollection(entityType: "material" | "activity") {
  if (entityType === "material") {
    return COLLECTIONS.materials
  }
  return COLLECTIONS.activities
}

export async function DELETE(req: NextRequest) {
  const authCheck = await assertIsAdmin(req)
  if (!authCheck.ok) {
    return NextResponse.json(
      { error: authCheck.message },
      { status: authCheck.status }
    )
  }

  let body: DeleteAttachmentBody

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const entityType = body.entityType
  const entityId = body.entityId?.trim()
  const attachmentUrl = body.attachmentUrl?.trim()

  if (
    (entityType !== "material" && entityType !== "activity") ||
    !entityId ||
    !attachmentUrl
  ) {
    return NextResponse.json(
      {
        error:
          "entityType (material|activity), entityId and attachmentUrl are required",
      },
      { status: 400 }
    )
  }

  try {
    const ref = adminDb.collection(resolveCollection(entityType)).doc(entityId)
    const snap = await ref.get()

    if (!snap.exists) {
      return NextResponse.json({ error: "Entity not found" }, { status: 404 })
    }

    const data = snap.data()
    const currentAttachments = Array.isArray(data?.attachments)
      ? data.attachments
      : []

    const nextAttachments = currentAttachments.filter(
      (item: { url?: unknown }) => item?.url !== attachmentUrl
    )

    if (nextAttachments.length === currentAttachments.length) {
      return NextResponse.json({ error: "Attachment not found" }, { status: 404 })
    }

    if (isCloudinaryUrl(attachmentUrl)) {
      await deleteCloudinaryAssetsByUrls([attachmentUrl])
    }

    await ref.set(
      {
        attachments: nextAttachments,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    )

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("delete attachment failed", err)
    return NextResponse.json(
      { error: "Could not delete attachment" },
      { status: 500 }
    )
  }
}
