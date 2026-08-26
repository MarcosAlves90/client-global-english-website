import * as React from "react"
import type { LucideIcon } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface DashboardStatCardProps { title: string; value: string | number; icon: LucideIcon; description?: string; trend?: { value: string; positive?: boolean }; className?: string; loading?: boolean }
export const DashboardStatCard = React.memo(function DashboardStatCard({ title, value, icon: Icon, description, trend, className, loading = false }: DashboardStatCardProps) {
  return <Card className={cn("py-4", className)}><CardContent className="flex items-center gap-4 px-4"><div className="ge-icon-tile size-10 shrink-0"><Icon className="size-4.5" /></div><div className="min-w-0 flex-1"><p className="text-xs font-medium text-muted-foreground">{title}</p><div className="mt-0.5 flex items-baseline gap-2"><span className="text-2xl font-semibold tracking-[-0.035em]">{loading ? <span className="inline-block h-7 w-16 animate-pulse rounded-md bg-muted" /> : value}</span>{trend ? <span className={cn("text-xs font-medium", trend.positive ? "text-emerald-600 dark:text-emerald-400" : "text-destructive")}>{trend.value}</span> : null}</div>{description ? <p className="mt-0.5 truncate text-xs text-muted-foreground">{description}</p> : null}</div></CardContent></Card>
})
