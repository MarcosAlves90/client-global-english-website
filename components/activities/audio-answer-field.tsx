"use client"

import * as React from "react"
import { Loader2, Trash2 } from "lucide-react"

import { AudioRecorder } from "@/components/media/audio-recorder"
import { Button } from "@/components/ui/button"
import { uploadMedia } from "@/lib/cloudinary-actions"

export function AudioAnswerField({
  value,
  disabled,
  onChange,
}: Readonly<{
  value: string
  disabled?: boolean
  onChange: (value: string) => void
}>) {
  const [uploading, setUploading] = React.useState(false)

  const uploadAnswer = React.useCallback(
    async (file: File) => {
      setUploading(true)
      try {
        const formData = new FormData()
        formData.append("file", file)
        const uploaded = await uploadMedia(formData, "activity-answers")
        onChange(uploaded.secure_url)
      } finally {
        setUploading(false)
      }
    },
    [onChange]
  )

  return (
    <div className="space-y-3">
      {value ? (
        <div className="ge-inset flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
          <audio controls preload="metadata" src={value} className="h-9 max-w-full" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled || uploading}
            onClick={() => onChange("")}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="size-4" />
            Remover resposta
          </Button>
        </div>
      ) : null}
      <AudioRecorder
        label={value ? "Gravar nova resposta" : "Gravar resposta em áudio"}
        disabled={disabled || uploading}
        onAudioReady={uploadAnswer}
      />
      {uploading ? (
        <p className="inline-flex items-center gap-1.5 text-xs font-medium text-primary">
          <Loader2 className="size-3.5 animate-spin" />
          Compactando e salvando resposta...
        </p>
      ) : null}
    </div>
  )
}
