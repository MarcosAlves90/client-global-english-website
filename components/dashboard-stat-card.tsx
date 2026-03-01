import * as React from "react"
import { LucideIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface DashboardStatCardProps {
    title: string
    value: string | number
    icon: LucideIcon
    description?: string
    trend?: {
        value: string
        positive?: boolean
    }
    className?: string
    loading?: boolean
}

export const DashboardStatCard = React.memo(function DashboardStatCard({
    title,
    value,
    icon: Icon,
    description,
    trend,
    className,
    loading = false,
}: DashboardStatCardProps) {
    return (
        <Card className={cn(
            "relative overflow-hidden transition-all duration-500",
            "bg-card/40 backdrop-blur-md border-primary/10",
            "hover:bg-primary/5 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1",
            className
        )}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70">
                    {title}
                </CardTitle>
                <div className="rounded-2xl bg-primary/10 p-2.5 text-primary transition-colors group-hover:bg-primary/20">
                    <Icon className="size-4" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col gap-1.5">
                    <div className="text-3xl font-bold tracking-tighter text-foreground">
                        {loading ? (
                            <span className="inline-block animate-pulse rounded-lg bg-muted h-9 w-20" />
                        ) : (
                            value
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {description && (
                            <p className="text-xs font-medium text-muted-foreground/60">
                                {description}
                            </p>
                        )}
                        {trend && (
                            <span className={cn(
                                "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold tracking-tight",
                                trend.positive
                                    ? "bg-emerald-500/10 text-emerald-500"
                                    : "bg-destructive/10 text-destructive"
                            )}>
                                {trend.value}
                            </span>
                        )}
                    </div>
                </div>
            </CardContent>
            {/* Premium glass effect highlights */}
            <div className="absolute -right-6 -top-6 size-24 bg-primary/10 blur-3xl rounded-full opacity-50" />
            <div className="absolute -left-6 -bottom-6 size-24 bg-primary/5 blur-3xl rounded-full opacity-30" />
        </Card>
    )
})
