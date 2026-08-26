import type { ReactNode } from "react"
import { render } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

vi.mock("@/components/landing/dashboard-mockup", () => ({
  DashboardMockup: () => <div data-testid="dashboard-mockup" />,
}))

vi.mock("@/components/ui/button", () => ({
  Button: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

vi.mock("@/components/ui/logo", () => ({
  Logo: () => <svg aria-label="Global English" />,
}))

describe("landing SEO", () => {
  it("renders sanitized JSON-LD that describes the website and educational organization", async () => {
    const { default: Home } = await import("@/app/page")
    const { container } = render(<Home />)
    const script = container.querySelector('script[type="application/ld+json"]')

    expect(script).not.toBeNull()
    const data = JSON.parse(script?.textContent ?? "{}")
    expect(data["@context"]).toBe("https://schema.org")
    expect(data["@graph"].map((entry: { "@type": string }) => entry["@type"])).toEqual([
      "WebSite",
      "EducationalOrganization",
    ])
  })
})
