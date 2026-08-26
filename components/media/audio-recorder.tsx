"use client"

import * as React from "react"
import { CircleStop, Mic, Upload } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  AUDIO_LIMIT_SUMMARY,
  AUDIO_MAX_DURATION_SECONDS,
  AUDIO_RECORDING_BITRATE,
  buildRecordedAudioFile,
  formatMediaBytes,
  getAudioRecordingMimeType,
  validateAudioFile,
} from "@/lib/media/audio"
import { cn } from "@/lib/utils"

type AudioRecorderProps = Readonly<{
  onAudioReady: (file: File) => void | Promise<void>
  disabled?: boolean
  className?: string
  label?: string
  allowFileUpload?: boolean
}>

export function AudioRecorder({
  onAudioReady,
  disabled = false,
  className,
  label = "Gravar áudio",
  allowFileUpload = true,
}: AudioRecorderProps) {
  const [recording, setRecording] = React.useState(false)
  const [processing, setProcessing] = React.useState(false)
  const [elapsedSeconds, setElapsedSeconds] = React.useState(0)
  const [error, setError] = React.useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)
  const [previewSize, setPreviewSize] = React.useState<number | null>(null)
  const previewUrlRef = React.useRef<string | null>(null)
  const recorderRef = React.useRef<MediaRecorder | null>(null)
  const streamRef = React.useRef<MediaStream | null>(null)
  const chunksRef = React.useRef<Blob[]>([])
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const releaseStream = React.useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = null
  }, [])

  const clearPreview = React.useCallback(() => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    previewUrlRef.current = null
    setPreviewUrl(null)
    setPreviewSize(null)
  }, [])

  const setPreview = React.useCallback((file: File) => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    const url = URL.createObjectURL(file)
    previewUrlRef.current = url
    setPreviewUrl(url)
    setPreviewSize(file.size)
  }, [])

  const deliverAudio = React.useCallback(
    async (file: File) => {
      const validation = validateAudioFile(file)
      if (!validation.ok) {
        setError(validation.message)
        return
      }

      setError(null)
      setPreview(file)
      setProcessing(true)
      try {
        await onAudioReady(file)
        clearPreview()
      } catch {
        setError("Não foi possível processar o áudio. Tente novamente.")
      } finally {
        setProcessing(false)
      }
    },
    [clearPreview, onAudioReady, setPreview]
  )

  const stopRecording = React.useCallback(() => {
    const recorder = recorderRef.current
    if (recorder && recorder.state !== "inactive") recorder.stop()
  }, [])

  const startRecording = React.useCallback(async () => {
    if (disabled || processing || recording) return
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      setError("A gravação de áudio não é suportada neste navegador.")
      return
    }

    try {
      setError(null)
      setElapsedSeconds(0)
      chunksRef.current = []
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      })
      streamRef.current = stream
      const mimeType = getAudioRecordingMimeType()
      const recorder = new MediaRecorder(stream, {
        ...(mimeType ? { mimeType } : {}),
        audioBitsPerSecond: AUDIO_RECORDING_BITRATE,
      })
      recorderRef.current = recorder
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data)
      }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || mimeType || "audio/webm",
        })
        releaseStream()
        setRecording(false)
        if (blob.size > 0) void deliverAudio(buildRecordedAudioFile(blob))
      }
      recorder.start(500)
      setRecording(true)
      timerRef.current = setInterval(() => {
        setElapsedSeconds((current) => {
          const next = current + 1
          if (next >= AUDIO_MAX_DURATION_SECONDS) {
            queueMicrotask(stopRecording)
            return AUDIO_MAX_DURATION_SECONDS
          }
          return next
        })
      }, 1000)
    } catch {
      releaseStream()
      setRecording(false)
      setError("Não foi possível acessar o microfone. Verifique a permissão do navegador.")
    }
  }, [deliverAudio, disabled, processing, recording, releaseStream, stopRecording])

  React.useEffect(() => {
    return () => {
      const recorder = recorderRef.current
      if (recorder && recorder.state !== "inactive") {
        recorder.ondataavailable = null
        recorder.onstop = null
        recorder.stop()
      }
      releaseStream()
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
      previewUrlRef.current = null
    }
  }, [releaseStream])

  const progress = Math.min(100, (elapsedSeconds / AUDIO_MAX_DURATION_SECONDS) * 100)
  const busy = disabled || processing

  return (
    <div className={cn("ge-inset space-y-3 p-3", className)}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold">{label}</p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">{AUDIO_LIMIT_SUMMARY}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant={recording ? "destructive" : "outline"}
            disabled={busy}
            onClick={() => (recording ? stopRecording() : void startRecording())}
          >
            {recording ? <CircleStop className="size-4" /> : <Mic className="size-4" />}
            {recording ? "Parar" : "Gravar"}
          </Button>
          {allowFileUpload ? (
            <>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={busy || recording}
                onClick={() => inputRef.current?.click()}
              >
                <Upload className="size-4" />
                Enviar áudio
              </Button>
              <input
                ref={inputRef}
                className="sr-only"
                type="file"
                accept="audio/*,.aac,.flac,.m4a,.mp3,.ogg,.opus,.wav"
                aria-label="Selecionar arquivo de áudio"
                disabled={busy || recording}
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  event.target.value = ""
                  if (file) void deliverAudio(file)
                }}
              />
            </>
          ) : null}
        </div>
      </div>

      {recording ? (
        <div className="space-y-1.5" aria-live="polite">
          <div className="flex items-center justify-between text-[10px] font-medium text-muted-foreground">
            <span>Gravando</span>
            <span>{elapsedSeconds}s / {AUDIO_MAX_DURATION_SECONDS}s</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-primary/10">
            <div className="h-full rounded-full bg-destructive transition-[width]" style={{ width: `${progress}%` }} />
          </div>
        </div>
      ) : null}

      {processing ? <p className="text-[10px] font-medium text-primary">Compactando e enviando áudio...</p> : null}
      {error ? <p role="alert" className="text-[10px] font-medium text-destructive">{error}</p> : null}
      {previewUrl ? (
        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
          <audio controls preload="metadata" src={previewUrl} className="h-9 max-w-full" />
          {previewSize !== null ? <span className="text-[10px] text-muted-foreground">{formatMediaBytes(previewSize)}</span> : null}
        </div>
      ) : null}
    </div>
  )
}
