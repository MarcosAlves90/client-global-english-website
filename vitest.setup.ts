import "@testing-library/jest-dom/vitest"

if (typeof globalThis.localStorage === "undefined") {
  let entries = new Map<string, string>()

  const storage: Storage = {
    get length() {
      return entries.size
    },
    clear() {
      entries = new Map()
    },
    getItem(key: string) {
      return entries.get(key) ?? null
    },
    key(index: number) {
      return Array.from(entries.keys())[index] ?? null
    },
    removeItem(key: string) {
      entries.delete(key)
    },
    setItem(key: string, value: string) {
      entries.set(key, String(value))
    },
  }

  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: storage,
  })
}

if (!window.matchMedia) {
  window.matchMedia = ((query: string) => {
    return {
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }
  }) as typeof window.matchMedia
}
