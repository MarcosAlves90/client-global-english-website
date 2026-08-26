import { describe, expect, it } from "vitest"

import { resolveUserRole } from "@/lib/firebase/roles"

describe("resolveUserRole", () => {
  it("preserves the teacher role without granting admin access", () => {
    expect(resolveUserRole({ existingRole: "teacher" })).toBe("teacher")
  })

  it("defaults unprivileged accounts to user", () => {
    expect(resolveUserRole({ existingRole: null })).toBe("user")
  })
})
