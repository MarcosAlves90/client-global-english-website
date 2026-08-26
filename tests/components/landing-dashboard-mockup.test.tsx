import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { DashboardMockup } from "@/components/landing/dashboard-mockup"

describe("DashboardMockup", () => {
  it("labels the preview as illustrative and avoids fake telemetry numbers", () => {
    render(<DashboardMockup />)

    expect(screen.getByText("Prévia ilustrativa · sem dados reais")).toBeInTheDocument()
    expect(screen.queryByText("68%")).not.toBeInTheDocument()
    expect(screen.queryByText("04")).not.toBeInTheDocument()
    expect(screen.queryByText("12")).not.toBeInTheDocument()
    expect(screen.getByText("Progresso por atividade")).toBeInTheDocument()
  })
})
