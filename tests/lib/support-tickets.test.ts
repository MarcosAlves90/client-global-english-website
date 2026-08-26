import { describe, expect, it } from "vitest"

import { validateSupportTicketDraft } from "@/lib/support/tickets"

describe("validateSupportTicketDraft", () => {
  it("normalizes a valid ticket", () => {
    expect(
      validateSupportTicketDraft({
        subject: "  Activity issue  ",
        message: "  The activity does not open on my account.  ",
      })
    ).toEqual({
      ok: true,
      value: {
        subject: "Activity issue",
        message: "The activity does not open on my account.",
      },
    })
  })

  it("rejects incomplete requests", () => {
    expect(validateSupportTicketDraft({ subject: "Hi", message: "short" }).ok).toBe(false)
  })
})
