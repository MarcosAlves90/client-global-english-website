import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { ManagementGrid } from "@/modules/courses/ui/manage/ManagementGrid"

describe("ManagementGrid", () => {
  it("uses one column when creation is closed and the shared split layout when open", () => {
    const { container, rerender } = render(
      <ManagementGrid showCreatePanel={false}>
        <div>Biblioteca</div>
      </ManagementGrid>
    )

    expect(container.firstChild).toHaveClass("grid", "gap-6")
    expect(container.firstChild).not.toHaveClass(
      "lg:grid-cols-[minmax(0,1.35fr)_minmax(22rem,0.9fr)]"
    )

    rerender(
      <ManagementGrid showCreatePanel>
        <div>Criação</div>
        <div>Biblioteca</div>
      </ManagementGrid>
    )

    expect(container.firstChild).toHaveClass(
      "lg:grid-cols-[minmax(0,1.35fr)_minmax(22rem,0.9fr)]"
    )
  })
})
