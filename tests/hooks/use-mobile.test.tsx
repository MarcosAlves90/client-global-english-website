import { describe, expect, it } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { useIsMobile } from "@/hooks/use-mobile"

function setViewport(width: number) {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    value: width,
  })
  window.dispatchEvent(new Event("resize"))
}

describe("useIsMobile", () => {
  it("returns true when below the breakpoint", async () => {
    setViewport(600)
    const { result } = renderHook(() => useIsMobile())
    await waitFor(() => expect(result.current).toBe(true))
  })

  it("returns false when above the breakpoint", async () => {
    setViewport(1024)
    const { result } = renderHook(() => useIsMobile())
    await waitFor(() => expect(result.current).toBe(false))
  })
})
