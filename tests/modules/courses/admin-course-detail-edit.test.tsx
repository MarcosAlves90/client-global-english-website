import type { ReactNode } from "react"
import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const replace = vi.fn()

vi.mock("next/navigation", () => ({
  useParams: () => ({ courseId: "course-1" }),
  useRouter: () => ({ replace }),
  useSearchParams: () => new URLSearchParams("edit=1"),
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
    role: "admin",
    isFirebaseReady: true,
    user: { getIdToken: vi.fn().mockResolvedValue("token") },
  }),
}))

vi.mock("@/lib/cloudinary-actions", () => ({
  deleteMediaByUrl: vi.fn(),
}))

const course = {
  id: "course-1",
  title: "Business English",
  description: "Corporate communication",
  level: "Intermediate" as const,
  durationWeeks: 8,
  coverUrl: null,
  status: "Inscrições abertas",
  modulesCount: 2,
  studentsCount: 10,
  activitiesCount: 5,
  teacherIds: [],
}

vi.mock("@/modules/courses", () => ({
  fetchAdminCourses: vi.fn().mockResolvedValue([course]),
  saveAdminCourse: vi.fn(),
}))

vi.mock("@/modules/courses/ui/admin-course-form", () => ({
  createAdminCourseFormValue: (value?: typeof course) => ({
    title: value?.title ?? "",
    description: value?.description ?? "",
    level: value?.level ?? "Beginner",
    durationWeeks: String(value?.durationWeeks ?? 1),
    coverUrl: value?.coverUrl ?? "",
    status: value?.status ?? "Inscrições abertas",
    teacherIds: value?.teacherIds ?? [],
  }),
  AdminCourseForm: ({ value }: { value: { title: string } }) => (
    <input aria-label="Título do curso" value={value.title} readOnly />
  ),
}))

vi.mock("@/modules/users", () => ({
  fetchAdminTeachers: vi.fn().mockResolvedValue([]),
}))

beforeEach(() => {
  replace.mockClear()
})

describe("admin course detail editing", () => {
  it("opens the course editor inside the course route", async () => {
    const { default: CourseDetailPage } = await import("@/app/dashboard/admin/courses/[courseId]/page")

    render(<CourseDetailPage />)

    expect(await screen.findByDisplayValue("Business English")).toBeInTheDocument()
    expect(screen.getByText("Atualize os dados básicos e professores responsáveis sem sair do curso.")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /gerenciar curso/i })).toHaveAttribute(
      "href",
      "/dashboard/admin/courses/course-1/manage"
    )
  })
})
