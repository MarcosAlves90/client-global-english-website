import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const { uploadMediaMock } = vi.hoisted(() => ({ uploadMediaMock: vi.fn() }))

vi.mock("@/lib/cloudinary-actions", () => ({
  uploadMedia: uploadMediaMock,
}))

vi.mock("@/components/media/audio-recorder", () => ({
  AudioRecorder: ({ onAudioReady }: { onAudioReady: (file: File) => Promise<void> }) => (
    <button
      type="button"
      onClick={() => void onAudioReady(new File(["voice"], "voice.webm", { type: "audio/webm" }))}
    >
      Simular gravação
    </button>
  ),
}))

import { AudioAnswerField } from "@/components/activities/audio-answer-field"

describe("AudioAnswerField", () => {
  beforeEach(() => {
    uploadMediaMock.mockReset()
  })

  it("uploads a recorded answer and returns only its Cloudinary URL", async () => {
    const onChange = vi.fn()
    uploadMediaMock.mockResolvedValue({ secure_url: "https://res.cloudinary.com/demo/video/upload/answer.mp3" })

    render(<AudioAnswerField value="" onChange={onChange} />)
    fireEvent.click(screen.getByRole("button", { name: "Simular gravação" }))

    await waitFor(() => expect(uploadMediaMock).toHaveBeenCalledTimes(1))
    expect(onChange).toHaveBeenCalledWith("https://res.cloudinary.com/demo/video/upload/answer.mp3")
  })

  it("shows an existing answer and lets the student clear it before submitting", () => {
    const onChange = vi.fn()
    const { container } = render(
      <AudioAnswerField
        value="https://res.cloudinary.com/demo/video/upload/answer.mp3"
        onChange={onChange}
      />
    )

    expect(container.querySelector("audio")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: /remover resposta/i }))
    expect(onChange).toHaveBeenCalledWith("")
  })
})
