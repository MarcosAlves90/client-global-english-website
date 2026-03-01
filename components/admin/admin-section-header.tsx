import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface AdminSectionHeaderProps {
    title: string
    description?: string
    icon?: LucideIcon
    className?: string
    action?: React.ReactNode
}

export function AdminSectionHeader({
    title,
    description,
    icon: Icon,
    className,
    action,
}: AdminSectionHeaderProps) {
    return (
        <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-1", className)}>
            <div className="space-y-1">
                <div className="flex items-center gap-2">
                    {Icon && <Icon className="size-5 text-primary" />}
                    <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
                </div>
                {description && (
                    <p className="text-sm text-muted-foreground max-w-2xl">
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
