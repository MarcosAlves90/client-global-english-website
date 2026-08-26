import { describe, expect, it } from "vitest"

import {
  AUDIO_MAX_BYTES,
  AUDIO_MAX_DURATION_SECONDS,
  AUDIO_RECORDING_BITRATE,
  AUDIO_STORED_BITRATE,
  AUDIO_STORED_FREQUENCY,
  formatMediaBytes,
  getAudioCloudinaryUploadOptions,
  inferMediaAttachmentType,
  validateAudioFile,
} from "@/lib/media/audio"

describe("audio media policy", () => {
  it("keeps one explicit size and recording limit", () => {
    expect(AUDIO_MAX_BYTES).toBe(5 * 1024 * 1024)
    expect(AUDIO_MAX_DURATION_SECONDS).toBe(120)
    expect(AUDIO_RECORDING_BITRATE).toBe(64_000)
    expect(validateAudioFile({ name: "pronuncia.mp3", type: "audio/mpeg", size: AUDIO_MAX_BYTES })).toEqual({ ok: true })
    expect(validateAudioFile({ name: "pronuncia.mp3", type: "audio/mpeg", size: AUDIO_MAX_BYTES + 1 })).toEqual({
      ok: false,
      message: "O áudio excede o limite de 5 MB.",
    })
  })

  it("rejects non-audio files and formats visible file sizes", () => {
    expect(validateAudioFile({ name: "documento.pdf", type: "application/pdf", size: 1024 }).ok).toBe(false)
    expect(formatMediaBytes(512 * 1024)).toBe("512 KB")
    expect(formatMediaBytes(2.5 * 1024 * 1024)).toBe("2.5 MB")
  })

  it("infers attachment media types from MIME or extension without duplicating UI rules", () => {
    expect(inferMediaAttachmentType({ name: "pronuncia.mp3", type: "" })).toBe("audio")
    expect(inferMediaAttachmentType({ name: "aula.mp4", type: "" })).toBe("video")
    expect(inferMediaAttachmentType({ name: "handout.pdf", type: "application/pdf" })).toBe("pdf")
  })

  it("stores audio through the Cloudinary video pipeline as compact mp3", () => {
    expect(getAudioCloudinaryUploadOptions()).toEqual({
      resource_type: "video",
      format: "mp3",
      transformation: [
        {
          bit_rate: AUDIO_STORED_BITRATE,
          audio_frequency: AUDIO_STORED_FREQUENCY,
        },
      ],
    })
  })
})
