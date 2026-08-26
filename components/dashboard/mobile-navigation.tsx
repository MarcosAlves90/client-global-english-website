"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BookOpen, CalendarDays, ClipboardCheck, GraduationCap, Home, MoreHorizontal, Users2 } from "lucide-react"

import { useWorkspace } from "@/components/dashboard/workspace-context"
import { cn } from "@/lib/utils"

const studentItems = [
  { label: "Início", href: "/dashboard", icon: Home, exact: true },
  { label: "Cursos", href: "/dashboard/courses", icon: GraduationCap },
  { label: "Atividades", href: "/dashboard/activities", icon: ClipboardCheck },
  { label: "Agenda", href: "/dashboard/agenda", icon: CalendarDays },
  { label: "Mais", href: "/dashboard/settings", icon: MoreHorizontal },
]
const teacherItems = [
  { label: "Início", href: "/dashboard/teacher", icon: Home, exact: true },
  { label: "Cursos", href: "/dashboard/teacher", icon: BookOpen, exact: true },
  { label: "Correções", href: "/dashboard/teacher/grading", icon: ClipboardCheck },
  { label: "Gradebook", href: "/dashboard/teacher/gradebook", icon: GraduationCap },
  { label: "Mais", href: "/dashboard/settings", icon: MoreHorizontal },
]
const adminItems = [
  { label: "Início", href: "/dashboard/admin", icon: Home, exact: true },
  { label: "Usuários", href: "/dashboard/admin/users", icon: Users2 },
  { label: "Cursos", href: "/dashboard/admin/courses", icon: BookOpen },
  { label: "Mais", href: "/dashboard/settings", icon: MoreHorizontal },
]

export function MobileNavigation() {
  const pathname = usePathname()
  const { workspace, rememberWorkspace } = useWorkspace()
  const items = workspace === "admin" ? adminItems : workspace === "teacher" ? teacherItems : studentItems

  return (
    <nav aria-label="Navegação principal" className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-background/92 px-2 pb-[max(env(safe-area-inset-bottom),0.35rem)] pt-1.5 backdrop-blur-xl md:hidden">
      <div className="mx-auto flex max-w-lg items-end justify-around">
        {items.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
          return (
            <Link key={`${item.label}-${item.href}`} href={item.href} onClick={() => rememberWorkspace(workspace)} className={cn("flex min-w-14 flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[10px] font-medium text-muted-foreground transition-colors", active && "bg-primary/10 text-primary")} aria-current={active ? "page" : undefined}>
              <item.icon className="size-5" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
