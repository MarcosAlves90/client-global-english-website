import { Edit, Eye, Flame, ShieldCheck, Snowflake, Trash2, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { AdminUserSummary } from "@/lib/firebase/types"

import { ROLE_LABELS } from "@/modules/users/model/user"

type AdminUserCardProps = {
    item: AdminUserSummary
    isSelected: boolean
    onEdit: (user: AdminUserSummary) => void
    onFreeze: (user: AdminUserSummary) => void
    onDelete: (user: AdminUserSummary) => void
}

export function AdminUserCard({
    item,
    isSelected,
    onEdit,
    onFreeze,
    onDelete,
}: AdminUserCardProps) {
    const isAdmin = item.role === "admin"
    const isDisabled = item.disabled

    return (
        <div
            className={cn(
                "group relative flex flex-col rounded-xl rounded-t-none border bg-card p-3 transition-all duration-300",
                "hover:border-accent-foreground/30 hover:shadow-md",
                isSelected ? "border-primary bg-primary/5 ring-2 ring-primary shadow-sm" : "border-border",
                isDisabled && "grayscale-[0.8] opacity-80"
            )}
        >
            <div className="mb-2 flex items-start gap-3">
                <div
                    className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-full transition-colors duration-500",
                        isAdmin ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                        isSelected && "bg-primary text-primary-foreground"
                    )}
                >
                    {isAdmin ? <ShieldCheck className="size-4" /> : <User className="size-4" />}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-1.5">
                        <p className={cn("truncate text-sm font-bold tracking-tight", isSelected ? "text-primary" : "text-foreground")}>
                            {item.name}
                        </p>
                        {isAdmin ? (
                            <>
                                <ShieldCheck className="size-3 shrink-0 text-primary" />
                                <span className="sr-only">Admin</span>
                            </>
                        ) : null}
                    </div>
                    <p className="truncate text-[11px] text-muted-foreground">{item.email}</p>
                </div>
            </div>

            <div className="mb-2 flex items-center gap-2">
                <span
                    className={cn(
                        "inline-flex items-center rounded-md px-1 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                        isAdmin ? "border border-primary/20 bg-primary/20 text-primary" : "bg-secondary text-secondary-foreground"
                    )}
                >
                    {ROLE_LABELS[item.role]}
                </span>

                {isDisabled ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-blue-100 px-1 py-0.5 text-[9px] font-bold uppercase tracking-wider text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        <Snowflake className="size-2" />
                        OFF
                    </span>
                ) : null}
            </div>

            <div className="mt-auto flex items-center justify-between gap-1 border-t border-dashed pt-2 group-hover:border-accent-foreground/10">
                <div className="flex items-center gap-1">
                    <Button size="icon-xs" variant="ghost" className="size-7 rounded-full transition-colors hover:bg-primary/10 hover:text-primary" onClick={() => { }}>
                        <Eye className="size-3.5" />
                    </Button>
                    <Button
                        size="icon-xs"
                        variant="ghost"
                        className={cn(
                            "size-7 rounded-full transition-colors",
                            isSelected ? "bg-primary/10 text-primary" : "hover:bg-primary/10 hover:text-primary"
                        )}
                        onClick={() => onEdit(item)}
                    >
                        <Edit className="size-3.5" />
                    </Button>
                </div>

                <div className="flex items-center gap-1">
                    <Button
                        size="icon-xs"
                        className={cn(
                            "size-7 rounded-full border-none shadow-none transition-transform active:scale-90",
                            isDisabled ? "bg-yellow-400 text-amber-950 hover:bg-yellow-500" : "bg-blue-500 text-white hover:bg-blue-600"
                        )}
                        onClick={() => onFreeze(item)}
                    >
                        {isDisabled ? <Flame className="size-3.5" /> : <Snowflake className="size-3.5" />}
                    </Button>
                    <Button
                        size="icon-xs"
                        variant="destructive"
                        className="size-7 rounded-full transition-transform hover:rotate-12 active:scale-90"
                        onClick={() => onDelete(item)}
                    >
                        <Trash2 className="size-3.5" />
                    </Button>
                </div>
            </div>
        </div>
    )
}
