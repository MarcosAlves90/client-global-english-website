import { LucideIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface AdminStatCardProps {
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

export function AdminStatCard({
    title,
    value,
    icon: Icon,
    description,
    trend,
    className,
    loading = false,
}: AdminStatCardProps) {
    return (
        <Card className={cn(
            "relative overflow-hidden transition-all duration-300",
            "bg-card/40 backdrop-blur-sm border-primary/10",
            "hover:bg-primary/2 hover:border-primary/20 hover:shadow-lg",
            className
        )}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {title}
                </CardTitle>
                <div className="rounded-full bg-primary/10 p-2 text-primary">
                    <Icon className="size-4" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col gap-1">
                    <div className="text-3xl font-bold tracking-tight">
                        {loading ? (
                            <span className="inline-block animate-pulse rounded bg-muted h-9 w-16" />
                        ) : (
                            value
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {description && (
                            <p className="text-xs text-muted-foreground whitespace-nowrap">
                                {description}
                            </p>
                        )}
                        {trend && (
                            <span className={cn(
                                "inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium",
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
            {/* Decorative gradient corner */}
            <div className="absolute -right-4 -top-4 size-16 bg-primary/5 blur-2xl rounded-full" />
        </Card>
    )
}
