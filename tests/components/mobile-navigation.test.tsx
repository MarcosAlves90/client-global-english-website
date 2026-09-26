import { render, screen, within } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const { useWorkspaceMock } = vi.hoisted(() => ({ useWorkspaceMock: vi.fn() }))

vi.mock("@/components/dashboard/workspace-context", () => ({
  useWorkspace: useWorkspaceMock,
}))

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard/materials",
}))

import { MobileNavigation } from "@/components/dashboard/mobile-navigation"

describe("mobile navigation", () => {
  beforeEach(() => {
    useWorkspaceMock.mockReturnValue({ workspace: "student", rememberWorkspace: vi.fn() })
  })

  it("keeps every student destination, including Materials, reachable on narrow screens", () => {
    render(<MobileNavigation />)

    const navigation = screen.getByRole("navigation", { name: "Navegação principal" })
    const links = within(navigation).getAllByRole("link")

    expect(links.map((link) => link.textContent?.trim())).toEqual([
      "Início",
      "Cursos",
      "Materiais",
      "Atividades",
      "Agenda",
      "Mais",
    ])
    expect(within(navigation).getByRole("link", { name: "Materiais" })).toHaveAttribute(
      "href",
      "/dashboard/materials"
    )
    expect(within(navigation).getByRole("link", { name: "Materiais" })).toHaveAttribute(
      "aria-current",
      "page"
    )
    expect(navigation.querySelector(".overflow-x-auto")).toBeInTheDocument()
    expect(
      links.every((link) => link.classList.contains("shrink-0")),
      links.map((link) => link.className).join(" | ")
    ).toBe(true)
  })
})
