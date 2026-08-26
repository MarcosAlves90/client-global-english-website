import { afterEach, describe, expect, it } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"

import { AccessibilityMenu } from "@/components/accessibility-menu"

afterEach(() => {
  localStorage.clear()
  delete document.documentElement.dataset.contrast
  delete document.documentElement.dataset.fontScale
})

describe("AccessibilityMenu", () => {
  it("keeps accessibility controls collapsed until the user opens them", () => {
    render(<AccessibilityMenu />)

    expect(screen.getAllByRole("button")).toHaveLength(1)
    expect(screen.getByRole("button", { name: "Acessibilidade" })).toHaveAttribute(
      "aria-expanded",
      "false"
    )
    expect(screen.queryByRole("dialog", { name: /preferências de acessibilidade/i })).not.toBeInTheDocument()
  })

  it("applies explicit contrast and text-size preferences", async () => {
    render(<AccessibilityMenu />)

    fireEvent.click(screen.getByRole("button", { name: "Acessibilidade" }))
    fireEvent.click(screen.getByRole("button", { name: /alto contraste inativo/i }))
    fireEvent.click(screen.getByRole("button", { name: /texto grande.*110%/i }))

    await waitFor(() =>
      expect(document.documentElement).toHaveAttribute("data-contrast", "high")
    )
    expect(document.documentElement).toHaveAttribute("data-font-scale", "large")
    expect(JSON.parse(localStorage.getItem("ge-accessibility-preferences") ?? "{}")).toEqual({
      contrast: true,
      fontScale: "large",
    })
  })

  it("restores saved preferences and exposes the selected text size", async () => {
    localStorage.setItem(
      "ge-accessibility-preferences",
      JSON.stringify({ contrast: true, fontScale: "xlarge" })
    )

    render(<AccessibilityMenu />)

    await waitFor(() =>
      expect(document.documentElement).toHaveAttribute("data-contrast", "high")
    )
    expect(document.documentElement).toHaveAttribute("data-font-scale", "xlarge")

    fireEvent.click(screen.getByRole("button", { name: "Acessibilidade" }))
    expect(screen.getByRole("button", { name: /texto maior.*120%/i })).toHaveAttribute(
      "aria-pressed",
      "true"
    )
  })
})
