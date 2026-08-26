import * as React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { ActivitySelectionField } from "@/modules/courses/ui/manage/ActivitySelectionField"
import type { Activity, Track } from "@/lib/firebase/types"

const tracks: Track[] = [
  { id: "track-1", courseId: "course-1", title: "Módulo 1", description: "", order: 1 },
  { id: "track-2", courseId: "course-1", title: "Módulo 2", description: "", order: 2 },
]

const activities: Activity[] = [
  {
    id: "activity-1",
    courseId: "course-1",
    trackId: "track-1",
    title: "Atividade 1",
    type: "lesson",
    order: 1,
    estimatedMinutes: 20,
    questions: [],
  },
  {
    id: "activity-2",
    courseId: "course-1",
    trackId: "track-2",
    title: "Atividade 2",
    type: "quiz",
    order: 1,
    estimatedMinutes: 15,
    questions: [],
  },
]

function SelectionHarness() {
  const [selectedActivityId, setSelectedActivityId] = React.useState("activity-1")
  const trackById = React.useMemo(
    () => new Map(tracks.map((track) => [track.id, track] as const)),
    []
  )

  return (
    <>
      <ActivitySelectionField
        activities={activities}
        selectedActivityId={selectedActivityId}
        onSelectedActivityIdChange={setSelectedActivityId}
        trackById={trackById}
      />
      <output aria-label="Atividade ativa">{selectedActivityId}</output>
    </>
  )
}

describe("ActivitySelectionField", () => {
  it("lets administrators select another existing activity", () => {
    render(<SelectionHarness />)

    const selector = screen.getByRole("combobox", { name: "Atividade selecionada" })
    expect(selector).toHaveValue("activity-1")
    expect(screen.getByLabelText("Atividade ativa")).toHaveTextContent("activity-1")

    fireEvent.change(selector, { target: { value: "activity-2" } })

    expect(selector).toHaveValue("activity-2")
    expect(screen.getByLabelText("Atividade ativa")).toHaveTextContent("activity-2")
  })
})
