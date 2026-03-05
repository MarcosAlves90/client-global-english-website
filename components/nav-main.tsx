"use client"

import * as React from "react"
import { type LucideIcon } from "lucide-react"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import Link from "next/link"

export const NavMain = React.memo(function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon: LucideIcon
    isActive?: boolean
    badgeCount?: number
  }[]
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Plataforma</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton asChild tooltip={item.title} isActive={item.isActive}>
              <Link href={item.url}>
                <span className="relative inline-flex">
                  <item.icon className="size-4 shrink-0" />
                  {typeof item.badgeCount === "number" && item.badgeCount > 0 ? (
                    <span className="absolute -right-1.5 -top-1.5 min-w-4 rounded-full bg-yellow-400 px-1 text-center text-[10px] font-bold leading-4 text-yellow-950 shadow-sm">
                      {item.badgeCount > 99 ? "99+" : item.badgeCount}
                    </span>
                  ) : null}
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
