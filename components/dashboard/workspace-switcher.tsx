"use client"

import { useRouter } from "next/navigation"
import { ChevronsUpDown } from "lucide-react"

import { useWorkspace } from "@/components/dashboard/workspace-context"
import { useAuth } from "@/hooks/use-auth"
import { getAvailableWorkspaces, type WorkspaceId } from "@/lib/navigation/workspaces"
import { cn } from "@/lib/utils"

export function WorkspaceSwitcher({ workspace, compact = false }: { workspace: WorkspaceId; compact?: boolean }) {
  const router = useRouter()
  const { role } = useAuth()
  const { rememberWorkspace } = useWorkspace()
  const workspaces = getAvailableWorkspaces(role)
  const current = workspaces.find((item) => item.id === workspace) ?? workspaces[0]

  if (workspaces.length === 1) {
    return compact ? null : <span className="text-xs font-medium text-muted-foreground">{current.label}</span>
  }

  return (
    <label className={cn("relative block", compact ? "w-full" : "min-w-32")}>
      <span className="sr-only">Trocar área</span>
      <select
        aria-label="Trocar área"
        className="h-9 w-full appearance-none rounded-xl border border-border bg-background px-3 pr-8 text-sm font-medium outline-none transition-colors hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring/30"
        value={workspace}
        onChange={(event) => {
          const next = workspaces.find((item) => item.id === event.target.value)
          if (next) {
            rememberWorkspace(next.id)
            router.push(next.home)
          }
        }}
      >
        {workspaces.map((item) => (
          <option key={item.id} value={item.id}>{item.label}</option>
        ))}
      </select>
      <ChevronsUpDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
    </label>
  )
}
