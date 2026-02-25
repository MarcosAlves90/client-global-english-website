import type { AdminUserSummary } from "@/lib/firebase/types"

const USERS_CACHE_TTL = 60_000
const usersCache = new Map<
  string,
  { data: AdminUsersPageResponse; ts: number }
>()

export type AdminUsersPageResponse = {
  items: AdminUserSummary[]
  nextCursor: string | null
}

type UpsertUserPayload = {
  uid?: string
  name: string
  email: string
  role: "admin" | "user"
  team: string | null
}

export async function fetchAdminUsersPage(params: {
  idToken: string | null
  pageSize: number
  cursor: string | null
  force?: boolean
}) {
  const cacheKey = `${params.pageSize}:${params.cursor ?? "__root__"}`
  const now = Date.now()
  const cached = usersCache.get(cacheKey)
  if (!params.force && cached && now - cached.ts < USERS_CACHE_TTL) {
    return cached.data
  }

  const query = new URLSearchParams({
    pageSize: String(params.pageSize),
  })

  if (params.cursor) {
    query.set("cursor", params.cursor)
  }

  const resp = await fetch(`/api/admin/users?${query.toString()}`, {
    headers: {
      ...(params.idToken ? { Authorization: `Bearer ${params.idToken}` } : {}),
    },
  })

  if (!resp.ok) {
    throw new Error("failed to load")
  }

  const data = (await resp.json()) as AdminUsersPageResponse
  usersCache.set(cacheKey, { data, ts: now })
  return data
}

export type CreateAdminUserResponse = AdminUserSummary & {
  initialPassword?: string
}

export async function upsertAdminUser(
  idToken: string | null,
  payload: UpsertUserPayload
) {
  const resp = await fetch("/api/admin/users", {
    method: payload.uid ? "PATCH" : "POST",
    headers: {
      "Content-Type": "application/json",
      ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
    },
    body: JSON.stringify(payload),
  })

  if (!resp.ok) {
    throw new Error(payload.uid ? "failed to update" : "failed to create")
  }

  usersCache.clear()
  if (!payload.uid) {
    return resp.json()
  }
}

export async function toggleAdminUserDisabled(
  idToken: string | null,
  payload: { uid: string; disabled: boolean }
) {
  const resp = await fetch("/api/admin/users", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
    },
    body: JSON.stringify(payload),
  })

  if (!resp.ok) {
    throw new Error("freeze failed")
  }

  usersCache.clear()
}

export async function deleteAdminUser(
  idToken: string | null,
  payload: { uid: string }
) {
  const resp = await fetch("/api/admin/users", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
    },
    body: JSON.stringify(payload),
  })

  if (!resp.ok) {
    throw new Error("delete failed")
  }

  usersCache.clear()
}
