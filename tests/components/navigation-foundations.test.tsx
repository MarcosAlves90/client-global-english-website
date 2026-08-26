import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { SearchField } from "@/components/dashboard/search-field"
import { SegmentedControl } from "@/components/dashboard/segmented-control"

describe("navigation foundations", () => {
  it("exposes segmented filters as an accessible single-choice control", () => {
    const onChange = vi.fn()

    render(
      <SegmentedControl
        ariaLabel="Estado da atividade"
        value="pending"
        options={[
          { value: "pending", label: "Pendentes" },
          { value: "completed", label: "Concluídas" },
        ]}
        onChange={onChange}
      />
    )

    expect(screen.getByRole("group", { name: "Estado da atividade" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Pendentes" })).toHaveAttribute(
      "aria-pressed",
      "true"
    )
    expect(screen.getByRole("button", { name: "Concluídas" })).toHaveAttribute(
      "aria-pressed",
      "false"
    )

    fireEvent.click(screen.getByRole("button", { name: "Concluídas" }))
    expect(onChange).toHaveBeenCalledWith("completed")
  })

  it("keeps search icons above the input surface with visible contrast", () => {
    const { container } = render(
      <SearchField value="writing" onChange={() => undefined} />
    )

    const searchIcon = container.querySelector(".lucide-search")
    const clearButton = screen.getByRole("button", { name: "Limpar busca" })

    expect(searchIcon).toHaveClass("z-10", "text-foreground/60")
    expect(clearButton).toHaveClass("z-10", "text-foreground/60")
  })

  it("keeps search input explicit and provides a clear action", () => {
    const onChange = vi.fn()

    render(
      <SearchField
        value="writing"
        onChange={onChange}
        ariaLabel="Buscar atividades"
      />
    )

    expect(screen.getByRole("textbox", { name: "Buscar atividades" })).toHaveValue(
      "writing"
    )
    fireEvent.click(screen.getByRole("button", { name: "Limpar busca" }))
    expect(onChange).toHaveBeenCalledWith("")
  })
})
