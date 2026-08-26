import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { AudioRecorder } from "@/components/media/audio-recorder"
import { AUDIO_LIMIT_SUMMARY, AUDIO_MAX_BYTES } from "@/lib/media/audio"

class FakeMediaRecorder {
  static isTypeSupported = vi.fn(() => true)
  state: RecordingState = "inactive"
  mimeType: string
  ondataavailable: ((event: BlobEvent) => void) | null = null
  onstop: (() => void) | null = null

  constructor(_stream: MediaStream, options?: MediaRecorderOptions) {
    this.mimeType = options?.mimeType || "audio/webm"
  }

  start() {
    this.state = "recording"
    this.ondataavailable?.({ data: new Blob(["voice"], { type: this.mimeType }) } as BlobEvent)
  }

  stop() {
    this.state = "inactive"
    this.onstop?.()
  }
}

describe("AudioRecorder", () => {
  const stopTrack = vi.fn()

  beforeEach(() => {
    stopTrack.mockReset()
    vi.stubGlobal("MediaRecorder", FakeMediaRecorder)
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: vi.fn().mockResolvedValue({
          getTracks: () => [{ stop: stopTrack }],
        }),
      },
    })
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:audio-preview")
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it("shows the shared limits and accepts a valid audio file", async () => {
    const onAudioReady = vi.fn().mockResolvedValue(undefined)
    render(<AudioRecorder onAudioReady={onAudioReady} />)

    expect(screen.getByText(AUDIO_LIMIT_SUMMARY)).toBeInTheDocument()
    const input = screen.getByLabelText("Selecionar arquivo de áudio")
    const file = new File(["voice"], "voice.mp3", { type: "audio/mpeg" })
    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => expect(onAudioReady).toHaveBeenCalledWith(file))
  })

  it("rejects audio above the visual size limit", async () => {
    const onAudioReady = vi.fn()
    render(<AudioRecorder onAudioReady={onAudioReady} />)

    const oversized = new File([new Uint8Array(AUDIO_MAX_BYTES + 1)], "too-large.mp3", {
      type: "audio/mpeg",
    })
    fireEvent.change(screen.getByLabelText("Selecionar arquivo de áudio"), {
      target: { files: [oversized] },
    })

    expect(await screen.findByRole("alert")).toHaveTextContent("excede o limite de 5 MB")
    expect(onAudioReady).not.toHaveBeenCalled()
  })

  it("records from the microphone and delivers a compressed-source audio file", async () => {
    const onAudioReady = vi.fn().mockResolvedValue(undefined)
    render(<AudioRecorder onAudioReady={onAudioReady} allowFileUpload={false} />)

    fireEvent.click(screen.getByRole("button", { name: "Gravar" }))
    await screen.findByRole("button", { name: "Parar" })
    fireEvent.click(screen.getByRole("button", { name: "Parar" }))

    await waitFor(() => expect(onAudioReady).toHaveBeenCalledTimes(1))
    const recorded = onAudioReady.mock.calls[0]?.[0] as File
    expect(recorded.type).toContain("audio/")
    expect(recorded.name).toMatch(/^gravacao-.*\.webm$/)
    expect(stopTrack).toHaveBeenCalled()
  })
})
