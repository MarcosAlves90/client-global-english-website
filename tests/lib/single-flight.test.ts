import { describe, expect, it, vi } from "vitest"

import { runSingleFlight } from "@/lib/async/single-flight"

describe("runSingleFlight", () => {
  it("shares one in-flight request for the same key", async () => {
    const requests = new Map<string, Promise<number>>()
    let resolveLoad: ((value: number) => void) | undefined
    const load = vi.fn(
      () =>
        new Promise<number>((resolve) => {
          resolveLoad = resolve
        })
    )

    const first = runSingleFlight(requests, "user-1", load)
    const second = runSingleFlight(requests, "user-1", load)

    expect(load).toHaveBeenCalledTimes(1)
    expect(first).toBe(second)

    resolveLoad?.(42)
    await expect(first).resolves.toBe(42)
    await expect(second).resolves.toBe(42)
  })

  it("allows a fresh request after the previous one settles", async () => {
    const requests = new Map<string, Promise<number>>()
    const load = vi.fn(async () => 7)

    await runSingleFlight(requests, "user-1", load)
    await Promise.resolve()
    await runSingleFlight(requests, "user-1", load)

    expect(load).toHaveBeenCalledTimes(2)
  })

  it("clears rejected requests so callers can retry", async () => {
    const requests = new Map<string, Promise<number>>()
    const load = vi
      .fn<() => Promise<number>>()
      .mockRejectedValueOnce(new Error("temporary"))
      .mockResolvedValueOnce(9)

    await expect(runSingleFlight(requests, "user-1", load)).rejects.toThrow("temporary")
    await Promise.resolve()
    await expect(runSingleFlight(requests, "user-1", load)).resolves.toBe(9)

    expect(load).toHaveBeenCalledTimes(2)
  })
})
