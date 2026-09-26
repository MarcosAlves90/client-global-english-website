"use client"

import { useEffect } from "react"
import { useAuthContext } from "@/components/auth/auth-provider"

export function useAuth() {
  const auth = useAuthContext()
  const ensureAuthInitialized = auth.ensureAuthInitialized

  useEffect(() => {
    ensureAuthInitialized()
  }, [ensureAuthInitialized])

  return auth
}
