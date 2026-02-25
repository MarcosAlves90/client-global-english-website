"use client"

import * as React from "react"
import {
  BookOpen,
  ClipboardCheck,
  Command,
  GraduationCap,
  LifeBuoy,
  Settings,
  ShieldCheck,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import { useAuth } from "@/hooks/use-auth"
import Link from "next/link"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, role, profile } = useAuth()
  const isAdmin = role === "admin"
  const displayName = React.useMemo(
    () => profile?.name || user?.displayName || "Usuário",
    [profile?.name, user?.displayName]
  )
  const email = React.useMemo(() => user?.email || "Sem email", [user?.email])
  const avatar = React.useMemo(() => user?.photoURL || "", [user?.photoURL])

  const navMain = React.useMemo(() => {
    const items = [
      {
        title: "Visão geral",
        url: "/dashboard",
        icon: Command,
        isActive: true,
      },
      {
        title: "Cursos",
        url: "/dashboard/courses",
        icon: GraduationCap,
        items: [
          { title: "Meus cursos", url: "/dashboard/courses" },
          { title: "Catálogo", url: "/dashboard/courses" },
        ],
      },
      {
        title: "Atividades",
        url: "/dashboard/activities",
        icon: ClipboardCheck,
        items: [
          { title: "Pendências", url: "/dashboard/activities" },
          { title: "Concluídas", url: "/dashboard/activities" },
        ],
      },
      {
        title: "Materiais",
        url: "/dashboard/materials",
        icon: BookOpen,
        items: [
          { title: "Biblioteca", url: "/dashboard/materials" },
          { title: "Favoritos", url: "/dashboard/materials" },
        ],
      },
    ]

    if (isAdmin) {
      items.push({
        title: "Admin",
        url: "/dashboard/admin",
        icon: ShieldCheck,
        items: [
          { title: "Usuários", url: "/dashboard/admin/users" },
          { title: "Cursos", url: "/dashboard/admin/courses" },
        ],
      })
    }

    return items
  }, [isAdmin])

  const navSecondary = React.useMemo(
    () => [
      { title: "Suporte", url: "#", icon: LifeBuoy },
      { title: "Configurações", url: "/dashboard/settings", icon: Settings },
    ],
    []
  )

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Global English</span>
                  <span className="truncate text-xs">Learning Hub</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{ name: displayName, email, avatar }}
          role={role}
        />
      </SidebarFooter>
    </Sidebar>
  )
}
