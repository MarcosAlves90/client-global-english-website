import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

describe("landing dashboard preview layout", () => {
  it("renders the dashboard preview without a second framed wrapper", () => {
    const source = readFileSync("app/page.tsx", "utf8")

    expect(source).toContain("<DashboardMockup /></section>")
    expect(source).not.toContain(
      '<div className="rounded-[2rem] border border-border bg-card p-3 shadow-xl shadow-black/8"><DashboardMockup /></div>'
    )
  })
})
