import { afterEach, describe, expect, it, vi } from "vitest"

afterEach(() => {
  vi.restoreAllMocks()
  vi.resetModules()
})

function mockFetchOnce(payload: unknown, ok = true) {
  vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
    ok,
    json: async () => payload,
  } as Response)
}

describe("admin users client", () => {
  it("caches pages and respects cursor", async () => {
    const { fetchAdminUsersPage } = await import(
      "@/modules/users/api/admin-users.client"
    )

    mockFetchOnce({ items: [], nextCursor: null })
    await fetchAdminUsersPage({
      idToken: "token",
      pageSize: 10,
      cursor: null,
    })
    await fetchAdminUsersPage({
      idToken: "token",
      pageSize: 10,
      cursor: null,
    })

    expect(fetch).toHaveBeenCalledTimes(1)
    expect(fetch).toHaveBeenCalledWith(
      "/api/admin/users?pageSize=10",
      expect.anything()
    )
  })

  it("creates a user with POST and returns JSON", async () => {
    const { upsertAdminUser } = await import(
      "@/modules/users/api/admin-users.client"
    )

    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ uid: "new", initialPassword: "Secret123!" }),
      } as Response)

    const result = await upsertAdminUser("token", {
      name: "User",
      email: "user@example.com",
      role: "user",
      team: null,
    })

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/admin/users",
      expect.objectContaining({ method: "POST" })
    )
    expect(result).toEqual({ uid: "new", initialPassword: "Secret123!" })
  })

  it("uses PATCH for updates", async () => {
    const { upsertAdminUser } = await import(
      "@/modules/users/api/admin-users.client"
    )

    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce({ ok: true } as Response)

    await upsertAdminUser("token", {
      uid: "1",
      name: "User",
      email: "user@example.com",
      role: "user",
      team: null,
    })

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/admin/users",
      expect.objectContaining({ method: "PATCH" })
    )
  })
})
