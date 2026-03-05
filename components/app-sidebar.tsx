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
import { Logo } from "@/components/ui/logo"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { usePathname } from "next/navigation"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, role, profile } = useAuth()
  const isAdmin = role === "admin"
  const displayName = React.useMemo(
    () => profile?.name || user?.displayName || "Usuário",
    [profile?.name, user?.displayName]
  )
  const email = React.useMemo(() => user?.email || "Sem email", [user?.email])
  const avatar = React.useMemo(() => user?.photoURL || "", [user?.photoURL])

  const pathname = usePathname()

  const navMain = React.useMemo(() => {
    const items = [
      {
        title: "Visão geral",
        url: "/dashboard",
        icon: Command,
        isActive: pathname === "/dashboard",
      },
      {
        title: "Cursos",
        url: "/dashboard/courses",
        icon: GraduationCap,
        isActive: pathname.startsWith("/dashboard/courses"),
      },
      {
        title: "Atividades",
        url: "/dashboard/activities",
        icon: ClipboardCheck,
        isActive: pathname.startsWith("/dashboard/activities"),
      },
      {
        title: "Materiais",
        url: "/dashboard/materials",
        icon: BookOpen,
        isActive: pathname.startsWith("/dashboard/materials"),
      },
    ]

    if (isAdmin) {
      items.push({
        title: "Admin",
        url: "/dashboard/admin",
        icon: ShieldCheck,
        isActive: pathname.startsWith("/dashboard/admin"),
      })
    }

    return items
  }, [isAdmin, pathname])

  const navSecondary = React.useMemo(
    () => [
      { title: "Suporte", url: "/dashboard/support", icon: LifeBuoy },
      { title: "Configurações", url: "/dashboard/settings", icon: Settings },
    ],
    []
  )

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild isActive>
              <Link href="/dashboard">
                <div className="flex items-center gap-3 text-sm font-semibold tracking-tight">
                  <Logo className="size-9" />
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
        />
      </SidebarFooter>
    </Sidebar>
  )
}
