"use client"

import * as React from "react"
import { Copy, Eye, Trash2 } from "lucide-react"

import { AudioRecorder } from "@/components/media/audio-recorder"
import { Button } from "@/components/ui/button"
import type { MediaAttachment } from "@/lib/firebase/types"
import { isAudioFile, validateAudioFile } from "@/lib/media/audio"
import { toast } from "sonner"

type ManagedAttachmentsPanelProps = Readonly<{
  entityLabel: string
  entityId: string
  attachments: MediaAttachment[]
  adding: boolean
  onAddFiles: (files: File[]) => void | Promise<void>
  onCopyAttachmentLink: (url: string) => Promise<void>
  onDeleteAttachment: (entityId: string, attachmentUrl: string) => void
}>

export function ManagedAttachmentsPanel({
  entityLabel,
  entityId,
  attachments,
  adding,
  onAddFiles,
  onCopyAttachmentLink,
  onDeleteAttachment,
}: ManagedAttachmentsPanelProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const addFiles = React.useCallback(
    async (files: File[]) => {
      const accepted: File[] = []
      for (const file of files) {
        if (isAudioFile(file)) {
          const validation = validateAudioFile(file)
          if (!validation.ok) {
            toast.error(`${file.name}: ${validation.message}`)
            continue
          }
        }
        accepted.push(file)
      }
      if (accepted.length) await onAddFiles(accepted)
    },
    [onAddFiles]
  )

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold">Anexos {entityLabel}</p>
          <p className="text-[10px] text-muted-foreground">
            Adicione novos arquivos sem recriar o conteúdo.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="xs"
          disabled={adding}
          onClick={() => fileInputRef.current?.click()}
        >
          {adding ? "Enviando..." : "Adicionar anexos"}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="sr-only"
          disabled={adding}
          aria-label={`Selecionar anexos ${entityLabel}`}
          onChange={(event) => {
            const files = Array.from(event.target.files ?? [])
            event.target.value = ""
            void addFiles(files)
          }}
        />
      </div>

      <AudioRecorder
        label={`Gravar áudio ${entityLabel}`}
        disabled={adding}
        onAudioReady={(file) => addFiles([file])}
      />
      {attachments.length === 0 ? (
        <p className="py-6 text-center text-[10px] font-medium text-muted-foreground/40">
          Sem anexos {entityLabel}.
        </p>
      ) : (
        <div className="grid gap-2">
          {attachments.map((attachment, index) => (
            <div key={`${entityId}-${attachment.url || index}`} className="ge-inset px-2 py-1.5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="break-all text-[11px] font-medium">
                    {attachment.name || `Anexo ${index + 1}`}
                  </p>
                  {attachment.type === "audio" && attachment.url ? (
                    <audio controls preload="metadata" src={attachment.url} className="mt-2 h-9 max-w-full" />
                  ) : null}
                </div>
                <div className="flex items-center gap-1 self-end sm:self-auto">
                  {attachment.url ? (
                    <>
                      <a
                        href={attachment.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex size-6 items-center justify-center rounded-full border border-border/70 bg-background/60 text-primary transition-colors hover:bg-primary/10"
                        aria-label={`Abrir anexo ${attachment.name || index + 1}`}
                      >
                        <Eye className="size-3" />
                      </a>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        type="button"
                        onClick={() => void onCopyAttachmentLink(attachment.url)}
                        aria-label={`Copiar link ${attachment.name || index + 1}`}
                      >
                        <Copy className="size-3" />
                      </Button>
                    </>
                  ) : null}
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    type="button"
                    onClick={() => onDeleteAttachment(entityId, attachment.url)}
                    className="text-destructive/60 hover:text-destructive"
                    aria-label={`Excluir anexo ${attachment.name || index + 1}`}
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
