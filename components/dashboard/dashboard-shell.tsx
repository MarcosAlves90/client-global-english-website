"use client"

import * as React from "react"

import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { MobileNavigation } from "@/components/dashboard/mobile-navigation"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { WorkspaceProvider } from "@/components/dashboard/workspace-context"

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <WorkspaceProvider>
      <SidebarProvider className="bg-background">
        <AppSidebar />
        <SidebarInset>{children}</SidebarInset>
        <MobileNavigation />
      </SidebarProvider>
    </WorkspaceProvider>
  )
}
