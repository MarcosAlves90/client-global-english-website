import * as React from "react"

import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { cn } from "@/lib/utils"

type DashboardPageProps = Readonly<{
  title: string
  description?: string
  breadcrumb?: string
  breadcrumbItems?: Array<{ label: string; href?: string }>
  action?: React.ReactNode
  toolbar?: React.ReactNode
  children: React.ReactNode
  className?: string
  contentClassName?: string
}>

export function DashboardPage({ title, description, breadcrumb, breadcrumbItems, action, toolbar, children, className, contentClassName }: DashboardPageProps) {
  return (
    <div className={cn("ge-page-enter min-h-full", className)}>
      <DashboardHeader title={title} description={description} breadcrumb={breadcrumb} breadcrumbItems={breadcrumbItems} action={action} />
      {toolbar ? <div className="border-b border-border/70 bg-background"><div className="mx-auto flex w-full max-w-[1440px] flex-wrap items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">{toolbar}</div></div> : null}
      <main className={cn("mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-6 px-4 py-6 pb-24 sm:px-6 sm:py-8 md:pb-8 lg:px-8", contentClassName)}>{children}</main>
    </div>
  )
}
