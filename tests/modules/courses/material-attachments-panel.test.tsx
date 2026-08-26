import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { MaterialAttachmentsPanel } from "@/modules/courses/ui/manage/MaterialAttachmentsPanel"
import type { Material } from "@/lib/firebase/types"
import { AUDIO_LIMIT_SUMMARY } from "@/lib/media/audio"

const material: Material = {
  id: "material-1",
  courseId: "course-1",
  trackId: "track-1",
  title: "Material existente",
  markdown: "Conteúdo existente",
  attachments: [],
}

describe("MaterialAttachmentsPanel", () => {
  it("allows adding files to an existing material even when it has no attachments", () => {
    const onAddMaterialAttachments = vi.fn()

    render(
      <MaterialAttachmentsPanel
        selectedMaterial={material}
        addingAttachments={false}
        onCopyAttachmentLink={vi.fn().mockResolvedValue(undefined)}
        onDeleteMaterialAttachment={vi.fn()}
        onAddMaterialAttachments={onAddMaterialAttachments}
      />
    )

    expect(screen.getByRole("button", { name: "Adicionar anexos" })).toBeEnabled()

    const file = new File(["content"], "novo.pdf", { type: "application/pdf" })
    fireEvent.change(screen.getByLabelText("Selecionar anexos para o material"), {
      target: { files: [file] },
    })

    expect(onAddMaterialAttachments).toHaveBeenCalledWith(material, [file])
  })

  it("disables additional uploads while the selected material is being updated", () => {
    render(
      <MaterialAttachmentsPanel
        selectedMaterial={material}
        addingAttachments
        onCopyAttachmentLink={vi.fn().mockResolvedValue(undefined)}
        onDeleteMaterialAttachment={vi.fn()}
        onAddMaterialAttachments={vi.fn()}
      />
    )

    expect(screen.getByRole("button", { name: "Enviando..." })).toBeDisabled()
    expect(screen.getByLabelText("Selecionar anexos para o material")).toBeDisabled()
  })
  it("keeps existing attachment actions available after enabling post-create uploads", () => {
    const onCopyAttachmentLink = vi.fn().mockResolvedValue(undefined)
    const onDeleteMaterialAttachment = vi.fn()
    const materialWithAttachment: Material = {
      ...material,
      attachments: [
        { name: "existente.pdf", url: "https://example.com/existente.pdf", type: "pdf" },
      ],
    }

    render(
      <MaterialAttachmentsPanel
        selectedMaterial={materialWithAttachment}
        addingAttachments={false}
        onCopyAttachmentLink={onCopyAttachmentLink}
        onDeleteMaterialAttachment={onDeleteMaterialAttachment}
        onAddMaterialAttachments={vi.fn()}
      />
    )

    expect(screen.getByRole("link", { name: "Abrir anexo existente.pdf" })).toHaveAttribute(
      "href",
      "https://example.com/existente.pdf"
    )
    fireEvent.click(screen.getByRole("button", { name: "Copiar link existente.pdf" }))
    fireEvent.click(screen.getByRole("button", { name: "Excluir anexo existente.pdf" }))

    expect(onCopyAttachmentLink).toHaveBeenCalledWith("https://example.com/existente.pdf")
    expect(onDeleteMaterialAttachment).toHaveBeenCalledWith(
      "material-1",
      "https://example.com/existente.pdf"
    )
  })

  it("offers recording and plays an existing compact audio attachment", () => {
    const audioUrl = "https://res.cloudinary.com/demo/video/upload/pronuncia.mp3"
    const materialWithAudio: Material = {
      ...material,
      attachments: [{ name: "pronuncia.mp3", url: audioUrl, type: "audio" }],
    }

    const { container } = render(
      <MaterialAttachmentsPanel
        selectedMaterial={materialWithAudio}
        addingAttachments={false}
        onCopyAttachmentLink={vi.fn().mockResolvedValue(undefined)}
        onDeleteMaterialAttachment={vi.fn()}
        onAddMaterialAttachments={vi.fn()}
      />
    )

    expect(screen.getByText("Gravar áudio para o material")).toBeInTheDocument()
    expect(screen.getByText(AUDIO_LIMIT_SUMMARY)).toBeInTheDocument()
    expect(container.querySelector("audio")).toHaveAttribute("src", audioUrl)
  })

})
