import { describe, expect, it } from "vitest"

import { validatePasswordChange } from "@/lib/auth/password-change"

describe("validatePasswordChange", () => {
  it("rejects short passwords", () => {
    expect(validatePasswordChange("short", "short")).toEqual({
      ok: false,
      message: "A senha precisa ter pelo menos 8 caracteres.",
    })
  })

  it("rejects mismatched confirmation", () => {
    expect(validatePasswordChange("Password1", "Password2").ok).toBe(false)
  })

  it("accepts a matching password with minimum length", () => {
    expect(validatePasswordChange("Password1", "Password1")).toEqual({ ok: true })
  })
})
