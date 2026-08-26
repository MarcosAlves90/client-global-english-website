import * as React from "react"
import type { LucideIcon } from "lucide-react"
import { AlertCircle, Info } from "lucide-react"

import { cn } from "@/lib/utils"

type DashboardNoticeProps = Readonly<{ children: React.ReactNode; tone?: "neutral" | "danger"; className?: string }>
export function DashboardNotice({ children, tone = "neutral", className }: DashboardNoticeProps) {
  const Icon = tone === "danger" ? AlertCircle : Info
  return <div role={tone === "danger" ? "alert" : "status"} className={cn("flex items-start gap-2.5 rounded-2xl border px-4 py-3 text-sm", tone === "danger" ? "border-destructive/25 bg-destructive/8 text-destructive" : "border-border bg-muted/45 text-muted-foreground", className)}><Icon className="mt-0.5 size-4 shrink-0" /><div className="min-w-0 flex-1">{children}</div></div>
}

type DashboardEmptyStateProps = Readonly<{ icon: LucideIcon; title: string; description: string; action?: React.ReactNode; className?: string }>
export function DashboardEmptyState({ icon: Icon, title, description, action, className }: DashboardEmptyStateProps) {
  return <div className={cn("flex flex-col items-center gap-4 rounded-3xl border border-dashed border-border bg-muted/30 px-6 py-12 text-center", className)}><div className="ge-icon-tile size-12"><Icon className="size-5" /></div><div className="max-w-lg space-y-1"><p className="font-semibold text-foreground">{title}</p><p className="text-sm leading-6 text-muted-foreground">{description}</p></div>{action ? <div>{action}</div> : null}</div>
}
