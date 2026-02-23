"use client"

import * as React from "react"
import {
  BookOpen,
  ClipboardCheck,
  Command,
  FolderKanban,
  GraduationCap,
  LifeBuoy,
  ListChecks,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
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
  const displayName = profile?.name || user?.displayName || "Usuário"
  const email = user?.email || "Sem email"
  const avatar = user?.photoURL || ""

  const navMain = [
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
      title: "Trilhas",
      url: "/dashboard/tracks",
      icon: FolderKanban,
      items: [
        { title: "Trilhas ativas", url: "/dashboard/tracks" },
        { title: "Trilhas concluídas", url: "/dashboard/tracks" },
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

  const navSecondary = [
    { title: "Suporte", url: "#", icon: LifeBuoy },
    { title: "Configurações", url: "/dashboard/settings", icon: Settings },
  ]

  const projects = [
    { name: "Agenda de estudos", url: "/dashboard/activities", icon: ListChecks },
    { name: "Grupos de prática", url: "/dashboard/tracks", icon: Users },
  ]

  if (isAdmin) {
    navMain.push({
      title: "Admin",
      url: "/dashboard/admin",
      icon: ShieldCheck,
      items: [
        { title: "Usuários", url: "/dashboard/admin/users" },
        { title: "Cursos", url: "/dashboard/admin/courses" },
      ],
    })
  }

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
        <NavProjects projects={projects} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={{ name: displayName, email, avatar }} role={role} />
      </SidebarFooter>
    </Sidebar>
  )
}

