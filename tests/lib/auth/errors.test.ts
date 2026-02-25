import { describe, expect, it } from "vitest"
import { getAuthErrorMessage } from "@/lib/auth/errors"

describe("getAuthErrorMessage", () => {
  it("maps firebase auth codes", () => {
    const message = getAuthErrorMessage(
      { code: "auth/invalid-email" },
      "fallback"
    )
    expect(message).not.toBe("fallback")
  })

  it("uses error message when no code match", () => {
    const message = getAuthErrorMessage({ message: "custom" }, "fallback")
    expect(message).toBe("custom")
  })

  it("falls back when no data", () => {
    const message = getAuthErrorMessage(null, "fallback")
    expect(message).toBe("fallback")
  })
})
