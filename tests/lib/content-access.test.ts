import { describe, expect, it } from "vitest"

import { isContentAvailableToUser } from "@/lib/firebase/content-access"

describe("isContentAvailableToUser", () => {
  const now = new Date("2026-08-21T12:00:00Z")

  it("keeps module content available after release", () => {
    expect(
      isContentAvailableToUser(
        { visibility: "module", releaseAt: "2026-08-21T11:00:00Z" },
        "user-1",
        now
      )
    ).toBe(true)
  })

  it("rejects private and non-assigned user content", () => {
    expect(isContentAvailableToUser({ visibility: "private" }, "user-1", now)).toBe(false)
    expect(
      isContentAvailableToUser(
        { visibility: "users", userIds: ["user-2"] },
        "user-1",
        now
      )
    ).toBe(false)
  })

  it("rejects content scheduled for the future", () => {
    expect(
      isContentAvailableToUser(
        { visibility: "users", userIds: ["user-1"], releaseAt: "2026-08-21T13:00:00Z" },
        "user-1",
        now
      )
    ).toBe(false)
  })
})
