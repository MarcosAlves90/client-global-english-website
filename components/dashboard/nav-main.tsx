import * as React from "react"
import Link from "next/link"
import { type LucideIcon } from "lucide-react"

import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"

export const NavMain = React.memo(function NavMain({ items, label = "Navegação" }: { label?: string; items: { title: string; url: string; icon: LucideIcon; isActive?: boolean; badgeCount?: number }[] }) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton asChild tooltip={item.title} isActive={item.isActive}>
              <Link href={item.url} aria-current={item.isActive ? "page" : undefined}>
                <span className="relative inline-flex">
                  <item.icon className="size-4 shrink-0" />
                  {typeof item.badgeCount === "number" && item.badgeCount > 0 ? <span className="absolute -right-2 -top-2 min-w-4 rounded-full bg-primary px-1 text-center text-[10px] font-semibold leading-4 text-primary-foreground">{item.badgeCount > 99 ? "99+" : item.badgeCount}</span> : null}
                </span>
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
})
