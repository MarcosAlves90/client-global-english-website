export function runSingleFlight<T>(
  inFlight: Map<string, Promise<T>>,
  key: string,
  load: () => Promise<T>
): Promise<T> {
  const existing = inFlight.get(key)
  if (existing) {
    return existing
  }

  const request = load()
  inFlight.set(key, request)

  void request.finally(() => {
    if (inFlight.get(key) === request) {
      inFlight.delete(key)
    }
  }).catch(() => {})

  return request
}
