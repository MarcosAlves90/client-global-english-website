"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { DashboardShell } from "@/components/dashboard-shell"
import { useAuth } from "@/hooks/use-auth"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, loading, profile } = useAuth()

  React.useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
      return
    }

    if (!loading && user && profile?.mustChangePassword) {
      router.push("/update-password")
    }
  }, [loading, user, profile?.mustChangePassword, router])

  if (loading || !user || profile?.mustChangePassword) {
    return null
  }

  return <DashboardShell>{children}</DashboardShell>
}

