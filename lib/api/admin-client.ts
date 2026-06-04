type AdminJsonRequestOptions = {
  idToken: string | null
  method?: "GET" | "POST" | "PATCH" | "DELETE"
  body?: unknown
  errorMessage: string | ((response: Response) => string)
}

export type TtlCacheEntry<T> = {
  data: T
  ts: number
}

export function getFreshCacheEntry<T>(
  entry: TtlCacheEntry<T> | null | undefined,
  ttlMs: number,
  now = Date.now()
) {
  if (!entry) {
    return null
  }

  return now - entry.ts < ttlMs ? entry : null
}

export function setCacheEntry<T>(data: T, ts = Date.now()): TtlCacheEntry<T> {
  return { data, ts }
}

export async function adminJsonRequest<T>(
  path: string,
  options: AdminJsonRequestOptions
) {
  const resp = await fetch(path, {
    method: options.method ?? "GET",
    headers: {
      ...(options.body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(options.idToken ? { Authorization: `Bearer ${options.idToken}` } : {}),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  })

  if (!resp.ok) {
    throw new Error(
      typeof options.errorMessage === "function"
        ? options.errorMessage(resp)
        : options.errorMessage
    )
  }

  if (resp.status === 204) {
    return undefined as T
  }

  if (typeof resp.json !== "function") {
    return undefined as T
  }

  return (await resp.json()) as T
}
