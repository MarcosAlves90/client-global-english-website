"use client"

import type { Material } from "@/lib/firebase/types"
import { ManagedAttachmentsPanel } from "./ManagedAttachmentsPanel"

type MaterialAttachmentsPanelProps = Readonly<{
  selectedMaterial: Material
  addingAttachments: boolean
  onCopyAttachmentLink: (url: string) => Promise<void>
  onDeleteMaterialAttachment: (materialId: string, attachmentUrl: string) => void
  onAddMaterialAttachments: (material: Material, files: File[]) => void | Promise<void>
}>

export function MaterialAttachmentsPanel({
  selectedMaterial,
  addingAttachments,
  onCopyAttachmentLink,
  onDeleteMaterialAttachment,
  onAddMaterialAttachments,
}: MaterialAttachmentsPanelProps) {
  return (
    <ManagedAttachmentsPanel
      entityLabel="para o material"
      entityId={selectedMaterial.id}
      attachments={selectedMaterial.attachments ?? []}
      adding={addingAttachments}
      onAddFiles={(files) => onAddMaterialAttachments(selectedMaterial, files)}
      onCopyAttachmentLink={onCopyAttachmentLink}
      onDeleteAttachment={onDeleteMaterialAttachment}
    />
  )
}
