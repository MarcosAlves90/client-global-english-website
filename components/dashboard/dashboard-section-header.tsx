import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface DashboardSectionHeaderProps {
    title: string
    description?: string
    icon?: LucideIcon
    className?: string
    action?: React.ReactNode
}

export function DashboardSectionHeader({
    title,
    description,
    icon: Icon,
    className,
    action,
}: DashboardSectionHeaderProps) {
    return (
        <div className={cn("flex flex-col gap-4 px-1 sm:flex-row sm:items-end sm:justify-between", className)}>
            <div className="space-y-1">
                <div className="flex items-center gap-2">
                    {Icon && (
                        <span className="ge-icon-tile size-8 rounded-full">
                            <Icon className="size-4" />
                        </span>
                    )}
                    <h2 className="text-lg font-semibold tracking-[-0.025em] text-foreground">{title}</h2>
                </div>
                {description && (
                    <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                        {description}
                    </p>
                )}
            </div>
            {action && (
                <div className="shrink-0 flex items-center gap-2">
                    {action}
                </div>
            )}
        </div>
    )
}
