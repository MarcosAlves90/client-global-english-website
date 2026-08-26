import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

describe("teacher grading desktop layout", () => {
  it("keeps the submissions and evaluation cards at independent heights", () => {
    const source = readFileSync("app/dashboard/teacher/grading/page.tsx", "utf8")

    expect(source).toContain('aria-label="Entregas e avaliação"')
    expect(source).toContain('className="grid items-start gap-5 lg:grid-cols-[0.85fr_1.15fr]"')
  })
})
