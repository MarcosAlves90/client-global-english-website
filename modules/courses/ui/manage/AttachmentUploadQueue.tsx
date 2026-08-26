"use client"

import * as React from "react"
import { AlertCircle, CheckCircle2, Eye, FileAudio, FileText, Loader2, Sparkles, Trash2, UploadCloud, Video, Link2 } from "lucide-react"

import { AudioRecorder } from "@/components/media/audio-recorder"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { NativeSelect } from "@/components/ui/native-select"
import { isAudioFile, validateAudioFile } from "@/lib/media/audio"
import { toast } from "sonner"
import { MATERIAL_TYPE_LABELS } from "./constants"

type AttachmentType = "pdf" | "video" | "link" | "audio"

export type UploadFeedbackState = {
  status: "idle" | "uploading" | "success" | "error"
  message: string
}

type AttachmentItem = {
  name: string
  url: string
  type: AttachmentType
}

type AttachmentUploadQueueProps = {
  label: string
  helperText: string
  emptyStateLabel: string
  attachments: AttachmentItem[]
  uploadingIndices: Record<number, boolean>
  uploadFeedback: Record<number, UploadFeedbackState>
  uploadProgress: Record<number, number>
  onRetryUpload: (index: number, file: File) => Promise<void>
  onAddFiles: (files: File[]) => Promise<void>
  onRemoveAttachment: (index: number) => Promise<void> | void
  onAttachmentTypeChange: (index: number, type: AttachmentType) => void
  onAttachmentNameChange: (index: number, name: string) => void
  onCopyLink?: (url: string) => Promise<void> | void
}

function getAttachmentIcon(type: AttachmentType) {
  if (type === "video") return Video
  if (type === "audio") return FileAudio
  if (type === "link") return Link2
  return FileText
}

function getStatusClass(status?: UploadFeedbackState["status"]) {
  if (status === "error") return "text-destructive"
  if (status === "success") return "text-emerald-600"
  return "text-muted-foreground"
}

export function AttachmentUploadQueue({
  label,
  helperText,
  emptyStateLabel,
  attachments,
  uploadingIndices,
  uploadFeedback,
  uploadProgress,
  onRetryUpload,
  onAddFiles,
  onRemoveAttachment,
  onAttachmentTypeChange,
  onAttachmentNameChange,
  onCopyLink,
}: AttachmentUploadQueueProps) {
  const filePickerRef = React.useRef<HTMLInputElement | null>(null)
  const [isDropZoneActive, setIsDropZoneActive] = React.useState(false)
  const fileInputIdPrefix = React.useId()

  const addValidatedFiles = React.useCallback(async (files: File[]) => {
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
  }, [onAddFiles])

  const handleFilePickerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    await addValidatedFiles(files)
    e.target.value = ""
  }

  const handleDropZoneDrop = async (e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault()
    setIsDropZoneActive(false)
    const files = Array.from(e.dataTransfer.files ?? [])
    await addValidatedFiles(files)
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="ge-kicker text-muted-foreground/70">{label}</p>
        <p className="text-[10px] font-medium text-muted-foreground/70">{helperText}</p>
      </div>

      <input ref={filePickerRef} type="file" multiple className="hidden" onChange={handleFilePickerChange} />

      <button
        type="button"
        onDragOver={(e) => {
          e.preventDefault()
          setIsDropZoneActive(true)
        }}
        onDragLeave={() => setIsDropZoneActive(false)}
        onDrop={(e) => void handleDropZoneDrop(e)}
        onClick={() => filePickerRef.current?.click()}
        className={`ge-surface-muted w-full cursor-pointer p-5 text-left transition-all ${
          isDropZoneActive
            ? "border-primary/45 bg-primary/10 shadow-lg shadow-primary/10"
            : "hover:border-primary/30 hover:bg-primary/5"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="ge-icon-tile size-10 rounded-full">
            <UploadCloud className="size-5" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium">Arraste e solte arquivos aqui</p>
            <p className="text-xs text-muted-foreground">Ou clique para selecionar. Upload automático com feedback em tempo real.</p>
          </div>
        </div>
      </button>

      <AudioRecorder
        label="Gravar áudio como anexo"
        onAudioReady={(file) => addValidatedFiles([file])}
      />
      <div className="space-y-2">
        {attachments.length === 0 ? (
          <div className="ge-surface-muted p-4 text-center text-[10px] font-medium text-muted-foreground/60">
            {emptyStateLabel}
          </div>
        ) : (
          attachments.map((attachment, index) => {
            const feedback = uploadFeedback[index]
            const progress = uploadProgress[index] ?? 0
            const statusClass = getStatusClass(feedback?.status)
            const AttachmentTypeIcon = getAttachmentIcon(attachment.type)
            const hasPreviewLink = Boolean(attachment.url?.trim())
            const itemKey = attachment.url || `${attachment.name || "attachment"}-${attachment.type}`
            const fileInputId = `${fileInputIdPrefix}-upload-${index}`

            return (
              <div key={itemKey} className="ge-inset space-y-3 overflow-hidden p-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 flex-1 items-start gap-2">
                    <div className="ge-icon-tile mt-0.5 size-8 rounded-full">
                      <AttachmentTypeIcon className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="grid gap-2 md:grid-cols-[120px,1fr]">
                        <NativeSelect
                          className="h-8 px-2 py-0 text-[10px] font-bold "
                          value={attachment.type}
                          onChange={(e) => onAttachmentTypeChange(index, e.target.value as AttachmentType)}
                        >
                          {Object.entries(MATERIAL_TYPE_LABELS)
                            .filter(([key]) => key !== "link")
                            .map(([key, labelOption]) => (
                              <option key={key} value={key}>
                                {labelOption}
                              </option>
                            ))}
                        </NativeSelect>
                        <Input
                          placeholder="Nome amigável do anexo"
                          value={attachment.name}
                          onChange={(e) => onAttachmentNameChange(index, e.target.value)}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-primary/10 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            feedback?.status === "error"
                              ? "bg-destructive/80"
                              : feedback?.status === "success"
                                ? "bg-emerald-500"
                                : "bg-primary"
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <p className={`text-[11px] inline-flex items-center gap-1 ${statusClass}`}>
                        {feedback?.status === "uploading" ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : feedback?.status === "success" ? (
                          <CheckCircle2 className="size-3" />
                        ) : feedback?.status === "error" ? (
                          <AlertCircle className="size-3" />
                        ) : (
                          <Sparkles className="size-3" />
                        )}
                        {feedback?.message ?? (attachment.url ? "Anexo pronto para visualização" : "Aguardando upload")}
                      </p>
                      {attachment.type === "audio" && hasPreviewLink ? (
                        <audio controls preload="metadata" src={attachment.url} className="h-9 max-w-full" />
                      ) : null}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 self-end sm:self-auto">
                    <input
                      type="file"
                      id={fileInputId}
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          if (isAudioFile(file)) {
                            const validation = validateAudioFile(file)
                            if (!validation.ok) {
                              toast.error(validation.message)
                              e.target.value = ""
                              return
                            }
                          }
                          void onRetryUpload(index, file)
                        }
                        e.target.value = ""
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      type="button"
                      disabled={uploadingIndices[index]}
                      onClick={() => document.getElementById(fileInputId)?.click()}
                      aria-label="Reenviar arquivo"
                    >
                      {uploadingIndices[index] ? <Loader2 className="size-3 animate-spin" /> : <UploadCloud className="size-3" />}
                    </Button>
                    {hasPreviewLink ? (
                      <a
                        href={attachment.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex size-6 items-center justify-center rounded-full border border-border/70 bg-background/60 text-primary transition-colors hover:bg-primary/10"
                        aria-label="Visualizar anexo"
                      >
                        <Eye className="size-3" />
                      </a>
                    ) : null}
                    {onCopyLink && hasPreviewLink ? (
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        type="button"
                        onClick={() => void onCopyLink(attachment.url)}
                        aria-label="Copiar link"
                      >
                        <Link2 className="size-3" />
                      </Button>
                    ) : null}
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      type="button"
                      onClick={() => void onRemoveAttachment(index)}
                      className="text-destructive/60 hover:text-destructive"
                      aria-label="Excluir anexo"
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
