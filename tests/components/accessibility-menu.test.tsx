import { afterEach, describe, expect, it } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"

import { AccessibilityMenu } from "@/components/accessibility-menu"

afterEach(() => {
  localStorage.clear()
  delete document.documentElement.dataset.contrast
  delete document.documentElement.dataset.fontScale
})

describe("AccessibilityMenu", () => {
  it("applies and stores contrast and text scale preferences", async () => {
    render(<AccessibilityMenu />)

    fireEvent.click(screen.getByRole("button", { name: /alto contraste inativo/i }))
    fireEvent.click(screen.getByRole("button", { name: /aumentar letras/i }))

    await waitFor(() =>
      expect(document.documentElement).toHaveAttribute("data-contrast", "high")
    )
    expect(document.documentElement).toHaveAttribute("data-font-scale", "large")
    expect(JSON.parse(localStorage.getItem("ge-accessibility-preferences") ?? "{}")).toEqual({
      contrast: true,
      fontScale: "large",
    })
  })

  it("restores saved preferences on mount", async () => {
    localStorage.setItem(
      "ge-accessibility-preferences",
      JSON.stringify({ contrast: true, fontScale: "xlarge" })
    )

    render(<AccessibilityMenu />)

    await waitFor(() =>
      expect(document.documentElement).toHaveAttribute("data-contrast", "high")
    )
    expect(document.documentElement).toHaveAttribute("data-font-scale", "xlarge")
  })
})
