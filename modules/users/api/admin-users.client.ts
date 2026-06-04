import type { AdminUserSummary } from "@/lib/firebase/types"
import {
  adminUsersPageResponseSchema,
  createAdminUserResponseSchema,
} from "@/lib/contracts/admin"
import {
  adminJsonRequest,
  getFreshCacheEntry,
  setCacheEntry,
} from "@/lib/api/admin-client"

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
  isRobot?: boolean
}

export async function fetchAdminUsersPage(params: {
  idToken: string | null
  pageSize: number
  cursor: string | null
  force?: boolean
}) {
  const cacheKey = `${params.pageSize}:${params.cursor ?? "__root__"}`
  const cached = usersCache.get(cacheKey)
  const fresh = params.force ? null : getFreshCacheEntry(cached, USERS_CACHE_TTL)
  if (fresh) {
    return fresh.data
  }

  const query = new URLSearchParams({
    pageSize: String(params.pageSize),
  })

  if (params.cursor) {
    query.set("cursor", params.cursor)
  }

  const data = await adminJsonRequest<AdminUsersPageResponse>(
    `/api/admin/users?${query.toString()}`,
    {
      idToken: params.idToken,
      errorMessage: "failed to load",
      schema: adminUsersPageResponseSchema,
    }
  )
  usersCache.set(cacheKey, setCacheEntry(data))
  return data
}

export type CreateAdminUserResponse = AdminUserSummary & {
  initialPassword?: string
}

export async function upsertAdminUser(
  idToken: string | null,
  payload: UpsertUserPayload
) {
  if (payload.uid) {
    await adminJsonRequest<void>("/api/admin/users", {
      idToken,
      method: "PATCH",
      body: payload,
      errorMessage: "failed to update",
    })

    usersCache.clear()
    return
  }

  const result = await adminJsonRequest<CreateAdminUserResponse>("/api/admin/users", {
    idToken,
    method: "POST",
    body: payload,
    errorMessage: "failed to create",
    schema: createAdminUserResponseSchema,
  })

  usersCache.clear()
  return result
}

export async function toggleAdminUserDisabled(
  idToken: string | null,
  payload: { uid: string; disabled: boolean }
) {
  await adminJsonRequest<void>("/api/admin/users", {
    idToken,
    method: "PATCH",
    body: payload,
    errorMessage: "freeze failed",
  })

  usersCache.clear()
}

export async function deleteAdminUser(
  idToken: string | null,
  payload: { uid: string }
) {
  await adminJsonRequest<void>("/api/admin/users", {
    idToken,
    method: "DELETE",
    body: payload,
    errorMessage: "delete failed",
  })

  usersCache.clear()
}
