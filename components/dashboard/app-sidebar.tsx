"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { BookOpen, CalendarDays, ClipboardCheck, ClipboardPenLine, GraduationCap, Home, LifeBuoy, Settings, Users2 } from "lucide-react"

import { NavMain } from "@/components/dashboard/nav-main"
import { NavSecondary } from "@/components/dashboard/nav-secondary"
import { NavUser } from "@/components/dashboard/nav-user"
import { WorkspaceSwitcher } from "@/components/dashboard/workspace-switcher"
import { Logo } from "@/components/ui/logo"
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
import { useAuth } from "@/hooks/use-auth"
import { fetchUserActivities, fetchUserActivityProgressList } from "@/lib/firebase/firestore"
import { useWorkspace } from "@/components/dashboard/workspace-context"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, profile, isFirebaseReady } = useAuth()
  const pathname = usePathname()
  const { workspace, rememberWorkspace } = useWorkspace()
  const [pendingActivitiesCount, setPendingActivitiesCount] = React.useState(0)
  const displayName = profile?.name || user?.displayName || "Usuário"
  const email = user?.email || "Sem email"
  const avatar = user?.photoURL || ""

  React.useEffect(() => {
    let active = true
    async function loadPending() {
      if (!user?.uid || !isFirebaseReady) return active && setPendingActivitiesCount(0)
      try {
        const [activities, progress] = await Promise.all([fetchUserActivities(user.uid), fetchUserActivityProgressList(user.uid)])
        const status = new Map(progress.map((item) => [item.activityId, item.status] as const))
        const count = activities.filter((activity) => status.get(activity.id) !== "completed").length
        if (active) setPendingActivitiesCount(count)
      } catch {
        if (active) setPendingActivitiesCount(0)
      }
    }
    void loadPending()
    return () => { active = false }
  }, [isFirebaseReady, user?.uid])

  const items = React.useMemo(() => {
    if (workspace === "teacher") return [
      { title: "Visão geral", url: "/dashboard/teacher", icon: Home, isActive: pathname === "/dashboard/teacher" },
      { title: "Correções", url: "/dashboard/teacher/grading", icon: ClipboardPenLine, isActive: pathname.startsWith("/dashboard/teacher/grading") },
      { title: "Gradebook", url: "/dashboard/teacher/gradebook", icon: ClipboardCheck, isActive: pathname.startsWith("/dashboard/teacher/gradebook") },
    ]
    if (workspace === "admin") return [
      { title: "Visão geral", url: "/dashboard/admin", icon: Home, isActive: pathname === "/dashboard/admin" },
      { title: "Usuários", url: "/dashboard/admin/users", icon: Users2, isActive: pathname.startsWith("/dashboard/admin/users") },
      { title: "Cursos", url: "/dashboard/admin/courses", icon: BookOpen, isActive: pathname.startsWith("/dashboard/admin/courses") },
    ]
    return [
      { title: "Visão geral", url: "/dashboard", icon: Home, isActive: pathname === "/dashboard" },
      { title: "Cursos", url: "/dashboard/courses", icon: GraduationCap, isActive: pathname.startsWith("/dashboard/courses") },
      { title: "Atividades", url: "/dashboard/activities", icon: ClipboardCheck, isActive: pathname.startsWith("/dashboard/activities"), badgeCount: pendingActivitiesCount },
      { title: "Agenda", url: "/dashboard/agenda", icon: CalendarDays, isActive: pathname.startsWith("/dashboard/agenda") },
      { title: "Notas", url: "/dashboard/grades", icon: GraduationCap, isActive: pathname.startsWith("/dashboard/grades") },
      { title: "Materiais", url: "/dashboard/materials", icon: BookOpen, isActive: pathname.startsWith("/dashboard/materials") },
    ]
  }, [pathname, pendingActivitiesCount, workspace])

  const secondary = React.useMemo(() => [
    { title: "Suporte", url: "/dashboard/support", icon: LifeBuoy },
    { title: "Configurações", url: "/dashboard/settings", icon: Settings },
  ], [])

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader className="gap-1.5 p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href={workspace === "admin" ? "/dashboard/admin" : workspace === "teacher" ? "/dashboard/teacher" : "/dashboard"}>
                <span className="ge-icon-tile size-9 bg-primary text-primary-foreground"><Logo className="size-5" /></span>
                <div className="grid flex-1 text-left text-sm leading-tight"><span className="truncate font-semibold">Global English</span><span className="truncate text-xs text-muted-foreground">Learning Hub</span></div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="px-2 group-data-[collapsible=icon]:hidden"><WorkspaceSwitcher workspace={workspace} compact /></div>
      </SidebarHeader>
      <SidebarContent><NavMain label={workspace === "admin" ? "Administração" : workspace === "teacher" ? "Professor" : "Aluno"} items={items} /><NavSecondary items={secondary} onNavigate={() => rememberWorkspace(workspace)} className="mt-auto" /></SidebarContent>
      <SidebarFooter><NavUser user={{ name: displayName, email, avatar }} /></SidebarFooter>
    </Sidebar>
  )
}
