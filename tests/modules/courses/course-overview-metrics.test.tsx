import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

vi.mock("@/modules/courses/ui/manage/CourseManagementContext", () => ({
  useCourseManagement: () => ({
    course: {
      id: "course-1",
      title: "Business English",
      description: "Course description",
      level: "Intermediate",
      durationWeeks: 8,
      coverUrl: null,
      status: "Pausado",
      modulesCount: 0,
      studentsCount: 0,
      activitiesCount: 0,
    },
    tracks: [],
    materials: [],
    activities: [],
  }),
}))

import { CourseOverview } from "@/modules/courses/ui/manage/CourseOverview"

describe("CourseOverview metrics", () => {
  it("shows the persisted course status instead of a hardcoded active state", () => {
    render(<CourseOverview />)

    expect(screen.getByText("Pausado")).toBeInTheDocument()
    expect(screen.queryByText("Ativo na Plataforma")).not.toBeInTheDocument()
  })
})
