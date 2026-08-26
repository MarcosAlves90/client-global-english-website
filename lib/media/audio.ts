export const AUDIO_MAX_BYTES = 5 * 1024 * 1024
export const AUDIO_MAX_DURATION_SECONDS = 120
export const AUDIO_RECORDING_BITRATE = 64_000
export const AUDIO_STORED_BITRATE = "64k"
export const AUDIO_STORED_FREQUENCY = 44_100

export const AUDIO_LIMIT_SUMMARY = "Até 5 MB · gravações de até 2 min · MP3 64 kbps"

const AUDIO_EXTENSIONS = [".aac", ".aiff", ".amr", ".flac", ".m4a", ".mp3", ".ogg", ".opus", ".wav", ".webm"]
const VIDEO_EXTENSIONS = [".avi", ".m4v", ".mkv", ".mov", ".mp4", ".webm"]

export type AudioFileLike = {
  name?: string
  size: number
  type?: string
}

export function isAudioFile(file: Pick<AudioFileLike, "name" | "type">) {
  if (file.type?.toLowerCase().startsWith("audio/")) return true
  const name = file.name?.toLowerCase() ?? ""
  return AUDIO_EXTENSIONS.some((extension) => name.endsWith(extension))
}

export function inferMediaAttachmentType(
  file: Pick<AudioFileLike, "name" | "type">
): "pdf" | "video" | "audio" {
  if (isAudioFile(file)) return "audio"
  if (file.type?.toLowerCase().startsWith("video/")) return "video"
  const name = file.name?.toLowerCase() ?? ""
  if (VIDEO_EXTENSIONS.some((extension) => name.endsWith(extension))) return "video"
  return "pdf"
}

export function validateAudioFile(file: AudioFileLike) {
  if (!isAudioFile(file)) {
    return { ok: false, message: "Selecione um arquivo de áudio válido." } as const
  }
  if (file.size <= 0) {
    return { ok: false, message: "O arquivo de áudio está vazio." } as const
  }
  if (file.size > AUDIO_MAX_BYTES) {
    return { ok: false, message: "O áudio excede o limite de 5 MB." } as const
  }
  return { ok: true } as const
}

export function formatMediaBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 KB"
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function getAudioRecordingMimeType() {
  if (typeof MediaRecorder === "undefined" || typeof MediaRecorder.isTypeSupported !== "function") {
    return ""
  }

  const candidates = [
    "audio/webm;codecs=opus",
    "audio/ogg;codecs=opus",
    "audio/mp4",
    "audio/webm",
  ]
  return candidates.find((candidate) => MediaRecorder.isTypeSupported(candidate)) ?? ""
}

export function buildRecordedAudioFile(blob: Blob, recordedAt = Date.now()) {
  const type = blob.type || "audio/webm"
  const extension = type.includes("ogg") ? "ogg" : type.includes("mp4") ? "m4a" : "webm"
  return new File([blob], `gravacao-${recordedAt}.${extension}`, { type })
}

export function getAudioCloudinaryUploadOptions() {
  return {
    resource_type: "video" as const,
    format: "mp3",
    transformation: [
      {
        bit_rate: AUDIO_STORED_BITRATE,
        audio_frequency: AUDIO_STORED_FREQUENCY,
      },
    ],
  }
}
