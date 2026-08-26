import type { UserRole } from "@/lib/firebase/types"

export type WorkspaceId = "student" | "teacher" | "admin"

export type WorkspaceDefinition = {
  id: WorkspaceId
  label: string
  home: string
}

const WORKSPACES: Record<WorkspaceId, WorkspaceDefinition> = {
  student: { id: "student", label: "Aluno", home: "/dashboard" },
  teacher: { id: "teacher", label: "Professor", home: "/dashboard/teacher" },
  admin: { id: "admin", label: "Administração", home: "/dashboard/admin" },
}

export function getAvailableWorkspaces(role: UserRole | null | undefined) {
  const result: WorkspaceDefinition[] = [WORKSPACES.student]
  if (role === "teacher" || role === "admin") result.push(WORKSPACES.teacher)
  if (role === "admin") result.push(WORKSPACES.admin)
  return result
}

export function getWorkspaceDefinition(workspace: WorkspaceId) {
  return WORKSPACES[workspace]
}

const SHARED_WORKSPACE_ROUTES = [
  "/dashboard/settings",
  "/dashboard/support",
] as const

function isSharedWorkspaceRoute(pathname: string) {
  return SHARED_WORKSPACE_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))
}

function isWorkspaceAvailable(workspace: WorkspaceId, role: UserRole | null | undefined) {
  return getAvailableWorkspaces(role).some((item) => item.id === workspace)
}

export function resolveWorkspace(
  pathname: string,
  role: UserRole | null | undefined,
  previousWorkspace?: WorkspaceId
): WorkspaceId {
  if (role === "admin" && pathname.startsWith("/dashboard/admin")) return "admin"
  if ((role === "teacher" || role === "admin") && pathname.startsWith("/dashboard/teacher")) return "teacher"

  if (isSharedWorkspaceRoute(pathname) && previousWorkspace && isWorkspaceAvailable(previousWorkspace, role)) {
    return previousWorkspace
  }

  return "student"
}
