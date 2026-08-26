"use client"

import * as React from "react"
import { usePathname } from "next/navigation"

import { useAuth } from "@/hooks/use-auth"
import { resolveWorkspace, type WorkspaceId } from "@/lib/navigation/workspaces"

type WorkspaceContextValue = {
  workspace: WorkspaceId
  rememberWorkspace: (workspace: WorkspaceId) => void
}

const WorkspaceContext = React.createContext<WorkspaceContextValue | null>(null)

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { role } = useAuth()
  const [rememberedWorkspace, setRememberedWorkspace] = React.useState<WorkspaceId>(() =>
    resolveWorkspace(pathname, role)
  )
  const workspace = resolveWorkspace(pathname, role, rememberedWorkspace)
  const rememberWorkspace = React.useCallback((nextWorkspace: WorkspaceId) => {
    setRememberedWorkspace(nextWorkspace)
  }, [])

  const value = React.useMemo(
    () => ({ workspace, rememberWorkspace }),
    [rememberWorkspace, workspace]
  )

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}

export function useWorkspace() {
  const context = React.useContext(WorkspaceContext)
  if (!context) {
    throw new Error("useWorkspace must be used within WorkspaceProvider")
  }
  return context
}
