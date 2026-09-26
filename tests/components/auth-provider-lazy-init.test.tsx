import { cleanup, render, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const authMocks = vi.hoisted(() => ({
  auth: { currentUser: null },
  hasFirebaseConfig: true,
  onAuthStateChanged: vi.fn((_auth: unknown, listener: (user: null) => void) => {
    queueMicrotask(() => listener(null))
    return vi.fn()
  }),
  fetchUserProfile: vi.fn(),
  signOutUser: vi.fn(),
}))

vi.mock("firebase/auth", () => ({
  onAuthStateChanged: authMocks.onAuthStateChanged,
}))

vi.mock("@/lib/firebase/client", () => ({
  auth: authMocks.auth,
  hasFirebaseConfig: authMocks.hasFirebaseConfig,
}))

vi.mock("@/lib/firebase/firestore", () => ({
  fetchUserProfile: authMocks.fetchUserProfile,
}))

vi.mock("@/lib/firebase/auth", () => ({
  signOutUser: authMocks.signOutUser,
}))

import { AuthProvider } from "@/components/auth/auth-provider"
import { useAuth } from "@/hooks/use-auth"

afterEach(cleanup)

beforeEach(() => {
  authMocks.onAuthStateChanged.mockClear()
  authMocks.fetchUserProfile.mockClear()
  authMocks.signOutUser.mockClear()
})

function AuthConsumer() {
  useAuth()
  return null
}

describe("lazy auth initialization", () => {
  it("does not initialize Firebase until an auth consumer requires it", () => {
    render(
      <AuthProvider>
        <div>Public content</div>
      </AuthProvider>
    )

    expect(authMocks.onAuthStateChanged).not.toHaveBeenCalled()
    expect(authMocks.fetchUserProfile).not.toHaveBeenCalled()
  })

  it("initializes Firebase when an auth consumer requires it", async () => {
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(authMocks.onAuthStateChanged).toHaveBeenCalledTimes(1)
    })
  })
})
