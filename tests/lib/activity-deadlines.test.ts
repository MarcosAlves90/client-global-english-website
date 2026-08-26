import { describe, expect, it } from "vitest"

import {
  getActivityTiming,
  parseActivityDate,
  serializeActivityDateInput,
  validateActivitySchedule,
} from "@/lib/activities/deadlines"

describe("activity deadlines", () => {
  it("parses supported date values and rejects invalid input", () => {
    expect(parseActivityDate("2026-08-22T10:00:00.000Z")?.toISOString()).toBe(
      "2026-08-22T10:00:00.000Z"
    )
    expect(parseActivityDate("not-a-date")).toBeNull()
    expect(parseActivityDate(null)).toBeNull()
  })

  it("serializes local date-time inputs before sending them to the server", () => {
    const serialized = serializeActivityDateInput("2026-08-22T10:30")
    expect(serialized).toBe(new Date("2026-08-22T10:30").toISOString())
  })

  it("rejects schedules whose dates are out of order", () => {
    expect(
      validateActivitySchedule({
        releaseAt: "2026-08-23T10:00:00.000Z",
        dueAt: "2026-08-22T10:00:00.000Z",
      }).ok
    ).toBe(false)

    expect(
      validateActivitySchedule({
        dueAt: "2026-08-22T10:00:00.000Z",
        closeAt: "2026-08-22T09:00:00.000Z",
      }).ok
    ).toBe(false)
  })

  it("distinguishes overdue from closed submissions", () => {
    const now = new Date("2026-08-22T12:00:00.000Z")

    expect(
      getActivityTiming(
        {
          dueAt: "2026-08-22T10:00:00.000Z",
          closeAt: "2026-08-22T14:00:00.000Z",
        },
        now
      )
    ).toMatchObject({ isOverdue: true, isClosed: false })

    expect(
      getActivityTiming(
        {
          dueAt: "2026-08-22T10:00:00.000Z",
          closeAt: "2026-08-22T11:00:00.000Z",
        },
        now
      )
    ).toMatchObject({ isOverdue: true, isClosed: true })
  })
})
