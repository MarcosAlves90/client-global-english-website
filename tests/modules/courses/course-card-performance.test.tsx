import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { AdminCourseCard } from "@/modules/courses/ui/admin-course-card"
import { StudentCourseCard } from "@/modules/courses/ui/student-course-card"

const COVER_URL = "https://res.cloudinary.com/demo/image/upload/sample.jpg"

describe("course card image loading", () => {
  it("defers offscreen student course covers", () => {
    render(
      <StudentCourseCard
        course={{
          id: "course-1",
          title: "Business English",
          description: "Course description",
          level: "Intermediate",
          durationWeeks: 8,
          coverUrl: COVER_URL,
          enrollment: {
            id: "enrollment-1",
            userId: "user-1",
            courseId: "course-1",
            status: "active",
            progress: 25,
          },
          tracks: [],
          activities: [],
        }}
      />
    )

    const cover = screen.getByRole("img", { name: "Business English" })
    expect(cover).toHaveAttribute("loading", "lazy")
    expect(cover).toHaveAttribute("decoding", "async")
  })

  it("defers offscreen admin course covers", () => {
    render(
      <AdminCourseCard
        course={{
          id: "course-1",
          title: "Admin Course",
          description: "Course description",
          level: "Advanced",
          durationWeeks: 6,
          coverUrl: COVER_URL,
          status: "Inscrições abertas",
          modulesCount: 2,
          studentsCount: 10,
          activitiesCount: 5,
        }}
        onDelete={vi.fn()}
      />
    )

    const cover = screen.getByRole("img", { name: "Admin Course" })
    expect(cover).toHaveAttribute("loading", "lazy")
    expect(cover).toHaveAttribute("decoding", "async")
  })
})
