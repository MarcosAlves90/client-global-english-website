"use client"

import * as React from "react"
import { onAuthStateChanged, type User } from "firebase/auth"
import { signOutUser } from "@/lib/firebase/auth"
import { auth, hasFirebaseConfig } from "@/lib/firebase/client"
import { fetchUserProfile } from "@/lib/firebase/firestore"
import type { UserProfile, UserRole } from "@/lib/firebase/types"

type AuthContextValue = {
  user: User | null
  role: UserRole | null
  profile: UserProfile | null
  loading: boolean
  isFirebaseReady: boolean
  refreshProfile: () => Promise<void>
}

const AuthContext = React.createContext<AuthContextValue>({
  user: null,
  role: null,
  profile: null,
  loading: true,
  isFirebaseReady: false,
  refreshProfile: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null)
  const [role, setRole] = React.useState<UserRole | null>(null)
  const [profile, setProfile] = React.useState<UserProfile | null>(null)
  const [loading, setLoading] = React.useState(true)
  const isFirebaseReady = hasFirebaseConfig && Boolean(auth)

  const loadProfile = React.useCallback(async (firebaseUser: User) => {
    try {
      const profile = await fetchUserProfile(firebaseUser.uid)

      if (profile?.disabled) {
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

  React.useEffect(() => {
    if (!isFirebaseReady || !auth) {
      setUser(null)
      setRole(null)
      setProfile(null)
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
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

    return () => unsubscribe()
  }, [isFirebaseReady, loadProfile])

  const refreshProfile = React.useCallback(async () => {
    if (!auth?.currentUser) {
      return
    }
    await loadProfile(auth.currentUser)
  }, [loadProfile])

  return (
    <AuthContext.Provider
      value={{ user, role, profile, loading, isFirebaseReady, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  return React.useContext(AuthContext)
}
