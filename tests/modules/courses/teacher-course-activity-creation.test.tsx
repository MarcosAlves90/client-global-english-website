import type { ReactNode } from "react"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import type { ActivityForm } from "@/modules/courses/ui/manage/courseManagement.types"

const createCourseActivity = vi.fn().mockResolvedValue({ id: "activity-2" })
const fetchTeacherCourseWorkspace = vi.fn().mockResolvedValue({
  course: {
    id: "course-1",
    title: "Business English",
    description: "Course",
    level: "Intermediate",
    durationWeeks: 8,
    coverUrl: null,
    status: "Inscrições abertas",
    modulesCount: 1,
    studentsCount: 1,
    activitiesCount: 0,
    teacherIds: ["teacher-1"],
  },
  tracks: [{ id: "track-1", courseId: "course-1", title: "Module 1", description: "", order: 1, userIds: [] }],
  students: [{ uid: "student-1", name: "Student", email: "student@example.com", role: "user", createdAt: null, updatedAt: null }],
  activities: [],
})

vi.mock("next/navigation", () => ({
  useParams: () => ({ courseId: "course-1" }),
}))

vi.mock("@/components/dashboard/dashboard-page", () => ({
  DashboardPage: ({ action, children }: { action?: ReactNode; children: ReactNode }) => (
    <div>
      <div>{action}</div>
      <main>{children}</main>
    </div>
  ),
}))

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    role: "teacher",
    isFirebaseReady: true,
    user: { getIdToken: vi.fn().mockResolvedValue("teacher-token") },
  }),
}))

vi.mock("@/modules/activities", () => ({
  createCourseActivity,
}))

vi.mock("@/modules/courses", () => ({
  fetchTeacherCourseWorkspace,
}))

vi.mock("@/modules/courses/ui/manage/ActivityCreator", () => ({
  ActivityCreator: ({ onCreate }: { onCreate: (form: ActivityForm) => Promise<boolean> }) => (
    <button
      type="button"
      onClick={() => void onCreate({
        trackId: "track-1",
        title: "Teacher activity",
        type: "assignment",
        estimatedMinutes: "20",
        order: "",
        visibility: "module",
        userIds: [],
        scheduleMode: "now",
        releaseAt: "",
        dueAt: "",
        closeAt: "",
        attachments: [],
        questions: [],
      })}
    >
      Criar atividade de teste
    </button>
  ),
}))

describe("teacher course activity creation", () => {
  it("lets an assigned teacher create an activity inside the course", async () => {
    const { default: TeacherCoursePage } = await import("@/app/dashboard/teacher/courses/[courseId]/page")

    render(<TeacherCoursePage />)

    const newActivity = await screen.findByRole("button", { name: /nova atividade/i })
    fireEvent.click(newActivity)
    fireEvent.click(screen.getByRole("button", { name: /criar atividade de teste/i }))

    await waitFor(() => {
      expect(createCourseActivity).toHaveBeenCalledWith(
        "teacher-token",
        expect.objectContaining({
          courseId: "course-1",
          trackId: "track-1",
          title: "Teacher activity",
        })
      )
    })
  })
})
