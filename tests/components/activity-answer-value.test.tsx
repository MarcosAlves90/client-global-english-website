import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { ActivityAnswerValueView } from "@/components/activities/activity-answer-value"

describe("ActivityAnswerValueView", () => {
  it("renders an audio player for audio-response answers", () => {
    const url = "https://res.cloudinary.com/demo/video/upload/answer.mp3"
    const { container } = render(
      <ActivityAnswerValueView questionType="audio_response" value={url} />
    )

    expect(container.querySelector("audio")).toHaveAttribute("src", url)
    expect(screen.getByRole("link", { name: /abrir áudio/i })).toHaveAttribute("href", url)
  })

  it("keeps normal answers readable as text", () => {
    render(<ActivityAnswerValueView questionType="short_answer" value="Good morning" />)
    expect(screen.getByText("Good morning")).toBeInTheDocument()
  })
})
