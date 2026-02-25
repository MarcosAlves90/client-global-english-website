import { describe, expect, it } from "vitest"
import { cn } from "@/lib/utils"

describe("cn", () => {
  it("merges tailwind classes and removes conflicts", () => {
    expect(cn("px-2", "px-4")).toBe("px-4")
  })

  it("handles conditional and falsy values", () => {
    expect(cn("text-sm", false && "hidden", undefined, "font-medium")).toBe(
      "text-sm font-medium"
    )
  })
})
