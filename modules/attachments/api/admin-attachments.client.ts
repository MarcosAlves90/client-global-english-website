import { clearAdminActivitiesCache } from "@/modules/activities/api/admin-activities.client"
import { clearAdminMaterialsCache } from "@/modules/materials/api/admin-materials.client"

export type DeleteAdminAttachmentPayload = {
  entityType: "material" | "activity"
  entityId: string
  attachmentUrl: string
}

export async function deleteAdminAttachment(
  idToken: string | null,
  payload: DeleteAdminAttachmentPayload
) {
  const resp = await fetch("/api/admin/attachments", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
    },
    body: JSON.stringify(payload),
  })

  if (!resp.ok) {
    throw new Error("delete attachment failed")
  }

  if (payload.entityType === "material") {
    clearAdminMaterialsCache()
  } else {
    clearAdminActivitiesCache()
  }
}
