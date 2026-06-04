import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import admin, { adminDb } from "@/lib/firebase/admin"
import { assertIsAdmin } from "@/lib/firebase/admin-request"
import {
  cloudinaryAssetUrlsMatch,
  deleteCloudinaryAssetsByUrls,
  isCloudinaryUrl,
} from "@/lib/cloudinary-admin"
import { normalizeCloudinaryUrlItems } from "@/lib/cloudinary-url"
import { COLLECTIONS } from "@/lib/firebase/collections"
import { adminAttachmentDeleteBodySchema } from "@/lib/contracts/admin"

type DeleteAttachmentBody = {
  entityType?: "material" | "activity"
  entityId?: string
  attachmentUrl?: string
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

  let body: unknown

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsedBody = adminAttachmentDeleteBodySchema.safeParse(body)
  if (!parsedBody.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const entityType = parsedBody.data.entityType
  const entityId = parsedBody.data.entityId?.trim()
  const attachmentUrl = parsedBody.data.attachmentUrl?.trim()

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

    const nextAttachments = normalizeCloudinaryUrlItems(
      currentAttachments.filter((item: { url?: unknown }) => {
      const currentUrl = typeof item?.url === "string" ? item.url : ""
      return !cloudinaryAssetUrlsMatch(currentUrl, attachmentUrl)
      })
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
