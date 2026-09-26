"use client"

import * as React from "react"
import type { User } from "firebase/auth"
import type { UserProfile, UserRole } from "@/lib/firebase/types"

type AuthContextValue = {
  user: User | null
  role: UserRole | null
  profile: UserProfile | null
  loading: boolean
  isFirebaseReady: boolean
  refreshProfile: () => Promise<void>
  signOut: () => Promise<void>
  ensureAuthInitialized: () => void
}

const AuthContext = React.createContext<AuthContextValue>({
  user: null,
  role: null,
  profile: null,
  loading: true,
  isFirebaseReady: false,
  refreshProfile: async () => { },
  signOut: async () => { },
  ensureAuthInitialized: () => { },
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null)
  const [role, setRole] = React.useState<UserRole | null>(null)
  const [profile, setProfile] = React.useState<UserProfile | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [isFirebaseReady, setIsFirebaseReady] = React.useState(false)
  const authInitializationStarted = React.useRef(false)
  const unsubscribeAuth = React.useRef<(() => void) | null>(null)

  const loadProfile = React.useCallback(async (firebaseUser: User) => {
    try {
      const { fetchUserProfile } = await import("@/lib/firebase/firestore")
      const profile = await fetchUserProfile(firebaseUser.uid)

      if (profile?.disabled) {
        const { signOutUser } = await import("@/lib/firebase/auth")
        await signOutUser()
        setRole(null)
        setProfile(null)
        return
      }

      setRole(profile?.role ?? "user")
      setProfile(profile)
    } catch {
      setRole("user")
      setProfile(null)
    }
  }, [])

  const ensureAuthInitialized = React.useCallback(() => {
    if (authInitializationStarted.current) {
      return
    }
    authInitializationStarted.current = true

    void (async () => {
      try {
        const [{ onAuthStateChanged }, { auth, hasFirebaseConfig }] = await Promise.all([
          import("firebase/auth"),
          import("@/lib/firebase/client"),
        ])
        const firebaseReady = hasFirebaseConfig && Boolean(auth)
        setIsFirebaseReady(firebaseReady)

        if (!firebaseReady || !auth) {
          setUser(null)
          setRole(null)
          setProfile(null)
          setLoading(false)
          return
        }

        unsubscribeAuth.current = onAuthStateChanged(auth, async (firebaseUser) => {
          setUser(firebaseUser)

          if (!firebaseUser) {
            setRole(null)
            setProfile(null)
            setLoading(false)
            return
          }

          try {
            await loadProfile(firebaseUser)
          } catch {
            setRole("user")
            setProfile(null)
          } finally {
            setLoading(false)
          }
        })
      } catch {
        setIsFirebaseReady(false)
        setUser(null)
        setRole(null)
        setProfile(null)
        setLoading(false)
      }
    })()
  }, [loadProfile])

  React.useEffect(() => {
    return () => unsubscribeAuth.current?.()
  }, [])

  const refreshProfile = React.useCallback(async () => {
    if (!isFirebaseReady) {
      return
    }
    const { auth } = await import("@/lib/firebase/client")
    if (auth?.currentUser) {
      await loadProfile(auth.currentUser)
    }
  }, [isFirebaseReady, loadProfile])

  const signOut = React.useCallback(async () => {
    const { signOutUser } = await import("@/lib/firebase/auth")
    await signOutUser()
  }, [])

  return (
    <AuthContext.Provider
      value={{ user, role, profile, loading, isFirebaseReady, refreshProfile, signOut, ensureAuthInitialized }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  return React.useContext(AuthContext)
}
