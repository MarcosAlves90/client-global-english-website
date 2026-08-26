"use client"

import * as React from "react"
import Link from "next/link"

import { useWorkspace } from "@/components/dashboard/workspace-context"
import { getWorkspaceDefinition } from "@/lib/navigation/workspaces"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { WorkspaceSwitcher } from "@/components/dashboard/workspace-switcher"

type DashboardHeaderProps = {
  title: string
  breadcrumb?: string
  breadcrumbItems?: Array<{ label: string; href?: string }>
  description?: string
  action?: React.ReactNode
}

export const DashboardHeader = React.memo(function DashboardHeader({ title, breadcrumb, breadcrumbItems, description, action }: DashboardHeaderProps) {
  const { workspace } = useWorkspace()
  const resolvedItems = React.useMemo(() => {
    if (breadcrumbItems?.length) return breadcrumbItems
    if (breadcrumb) return [{ label: breadcrumb }]
    return []
  }, [breadcrumb, breadcrumbItems])

  return (
    <div className="sticky top-0 z-30 border-b border-border/80 bg-background/88 backdrop-blur-xl">
      <header className="mx-auto flex min-h-16 w-full max-w-[1440px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <SidebarTrigger className="-ml-1 hidden md:inline-flex" />
        <Breadcrumb className="hidden min-w-0 md:block">
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink asChild><Link href={getWorkspaceDefinition(workspace).home}>Global English</Link></BreadcrumbLink></BreadcrumbItem>
            {resolvedItems.length ? resolvedItems.map((item, index) => {
              const isLast = index === resolvedItems.length - 1
              return <React.Fragment key={`${item.label}-${index}`}><BreadcrumbSeparator /><BreadcrumbItem>{isLast || !item.href ? <BreadcrumbPage>{item.label}</BreadcrumbPage> : <BreadcrumbLink asChild><Link href={item.href}>{item.label}</Link></BreadcrumbLink>}</BreadcrumbItem></React.Fragment>
            }) : <><BreadcrumbSeparator /><BreadcrumbItem><BreadcrumbPage>{title}</BreadcrumbPage></BreadcrumbItem></>}
          </BreadcrumbList>
        </Breadcrumb>
        <div className="md:hidden"><WorkspaceSwitcher workspace={workspace} /></div>
        <div className="ml-auto flex items-center gap-2">{action}</div>
      </header>
      <div className="mx-auto w-full max-w-[1440px] px-4 pb-5 sm:px-6 lg:px-8">
        <h1 className="text-[1.75rem] font-semibold tracking-[-0.035em] text-foreground sm:text-3xl">{title}</h1>
        {description ? <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p> : null}
      </div>
    </div>
  )
})
