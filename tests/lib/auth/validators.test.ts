import { describe, expect, it } from "vitest"
import {
  normalizeEmail,
  validateEmail,
  validateName,
  validatePassword,
} from "@/lib/auth/validators"

describe("auth validators", () => {
  it("normalizes emails", () => {
    expect(normalizeEmail("  USER@Example.COM ")).toBe("user@example.com")
  })

  it("validates names", () => {
    expect(validateName("")).toBeTruthy()
    expect(validateName("Al")).toBeTruthy()
    expect(validateName("Alice")).toBeNull()
  })

  it("validates emails", () => {
    expect(validateEmail("")).toBeTruthy()
    expect(validateEmail("invalid")).toBeTruthy()
    expect(validateEmail("user@example.com")).toBeNull()
  })

  it("validates passwords", () => {
    expect(validatePassword("")).toBeTruthy()
    expect(validatePassword("short")).toBeTruthy()
    expect(validatePassword("alllowercase1")).toBeTruthy()
    expect(validatePassword("ALLUPPERCASE1")).toBeTruthy()
    expect(validatePassword("ValidPass1")).toBeNull()
  })
})
