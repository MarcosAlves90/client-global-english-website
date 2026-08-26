import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { StudentActivityCard } from "@/modules/activities/ui/student-activity-card"
import { AdminCourseCard } from "@/modules/courses/ui/admin-course-card"
import { AdminUserCard } from "@/modules/users/ui/admin-user-card"
import { ReleaseControls } from "@/modules/courses/ui/manage/ReleaseControls"

afterEach(cleanup)

describe("remaining UI foundations", () => {
  it("keeps secondary primitives on the shared Cupertino surface contract", () => {
    render(
      <>
        <Badge variant="outline">Status</Badge>
        <Switch aria-label="Notificações" />
      </>
    )

    expect(screen.getByText("Status")).toHaveClass("bg-background")
    expect(screen.getByText("Status")).not.toHaveClass("backdrop-blur-md")

    const control = screen.getByRole("switch", { name: "Notificações" })
    expect(control).toHaveAttribute("aria-checked", "false")
    fireEvent.click(control)
    expect(control).toHaveAttribute("aria-checked", "true")
  })

  it("uses the shared solid surface contract for student activity cards", () => {
    render(
      <StudentActivityCard
        activity={{
          id: "activity-1",
          title: "Conversation practice",
          courseTitle: "Business English",
          type: "lesson",
          estimatedMinutes: 20,
          status: "in_progress",
        }}
      />
    )

    const title = screen.getByText("Conversation practice")
    expect(title.closest('[data-slot="card"]')).toHaveClass("ge-surface")
    expect(title.closest('[data-slot="card"]')).not.toHaveClass("ge-surface-interactive")
    expect(screen.getByText("Em andamento")).toBeInTheDocument()
  })

  it("shows overdue deadlines without treating them as closed", () => {
    render(
      <StudentActivityCard
        activity={{
          id: "activity-overdue",
          title: "Late writing",
          courseTitle: "Business English",
          type: "assignment",
          estimatedMinutes: 20,
          status: "pending",
          dueAt: "2020-01-01T12:00:00.000Z",
          closeAt: null,
        }}
      />
    )

    expect(screen.getByText("Prazo vencido")).toBeInTheDocument()
  })

  it("does not invent an activity duration when no estimate exists", () => {
    render(
      <StudentActivityCard
        activity={{
          id: "activity-no-duration",
          title: "Open practice",
          courseTitle: "Business English",
          type: "lesson",
          estimatedMinutes: 0,
          status: "pending",
        }}
      />
    )

    expect(screen.queryByText(/\d+ min/)).not.toBeInTheDocument()
  })

  it("keeps release choices explicit and accessible", () => {
    const onVisibilityChange = vi.fn()
    const onScheduleModeChange = vi.fn()

    render(
      <ReleaseControls
        visibility="module"
        onVisibilityChange={onVisibilityChange}
        scheduleMode="now"
        releaseAt=""
        onScheduleModeChange={onScheduleModeChange}
        onReleaseAtChange={vi.fn()}
      />
    )

    const moduleOption = screen.getByRole("button", { name: /publico do modulo/i })
    const usersOption = screen.getByRole("button", { name: /apenas alunos selecionados/i })
    const scheduleOption = screen.getByRole("button", { name: /agendar/i })

    expect(moduleOption).toHaveAttribute("aria-pressed", "true")
    expect(usersOption).toHaveAttribute("aria-pressed", "false")

    fireEvent.click(usersOption)
    fireEvent.click(scheduleOption)

    expect(onVisibilityChange).toHaveBeenCalledWith("users")
    expect(onScheduleModeChange).toHaveBeenCalledWith("scheduled")
  })

  it("surfaces revision requests as a distinct student activity state", () => {
    render(
      <StudentActivityCard
        activity={{
          id: "activity-revision",
          title: "Rewrite exercise",
          courseTitle: "Business English",
          type: "assignment",
          estimatedMinutes: 20,
          status: "in_progress",
          gradingStatus: "revision_requested",
          closeAt: "2020-01-01T12:00:00.000Z",
        }}
      />
    )

    expect(screen.getByText("Revisão solicitada")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /revisar/i })).toBeEnabled()
  })

  it("keeps admin cards actionable without placeholder controls", () => {
    render(
      <>
        <AdminUserCard
          item={{
            uid: "user-1",
            name: "Ana Silva",
            email: "ana@example.com",
            role: "teacher",
            team: "Teachers",
            disabled: false,
            isRobot: false,
            photoURL: null,
            createdAt: null,
            updatedAt: null,
          }}
          isSelected={false}
          onEdit={vi.fn()}
          onFreeze={vi.fn()}
          onDelete={vi.fn()}
        />
        <AdminCourseCard
          course={{
            id: "course-1",
            title: "Business English",
            description: "Corporate communication",
            level: "Intermediate",
            durationWeeks: 8,
            coverUrl: null,
            status: "Inscrições abertas",
            studentsCount: 12,
            modulesCount: 4,
            activitiesCount: 9,
            teacherIds: ["user-1"],
          }}
            onDelete={vi.fn()}
        />
      </>
    )

    expect(screen.queryByRole("button", { name: /visualizar ana silva/i })).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: /editar ana silva/i })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /abrir curso/i })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /editar business english/i })).toHaveAttribute("href", "/dashboard/admin/courses/course-1?edit=1")
    expect(screen.getByText("Business English").closest('[data-slot="card"]')).toHaveClass("ge-surface")
  })

})
