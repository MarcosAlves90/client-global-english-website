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
                "group relative flex flex-col rounded-xl border bg-card/40 backdrop-blur-sm p-4 transition-all duration-300",
                "hover:border-primary/30 hover:bg-primary/2 hover:shadow-xl hover:shadow-primary/5",
                isSelected ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20 shadow-lg" : "border-primary/10",
                isDisabled && "grayscale-[0.8] opacity-60"
            )}
        >
            <div className="mb-2 flex items-start gap-3">
                <div
                    className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-full overflow-hidden transition-colors duration-500",
                        isAdmin ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                        isSelected && "bg-primary text-primary-foreground"
                    )}
                >
                    {item.photoURL ? (
                        <img src={item.photoURL} alt={item.name} className="size-full object-cover" />
                    ) : isAdmin ? (
                        <ShieldCheck className="size-4" />
                    ) : (
                        <User className="size-4" />
                    )}
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

            <div className="mt-2 flex items-center gap-2">
                <span
                    className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                        isAdmin ? "bg-primary/10 text-primary border border-primary/20" : "bg-muted text-muted-foreground"
                    )}
                >
                    {ROLE_LABELS[item.role]}
                </span>

                {isDisabled ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-blue-400 border border-blue-500/20">
                        <Snowflake className="size-2.5" />
                        Congelado
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-500 border border-emerald-500/20">
                        <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Ativo
                    </span>
                )}
            </div>

            <div className="mt-4 flex items-center justify-between gap-1 border-t border-dashed border-primary/10 pt-4 group-hover:border-primary/20">
                <div className="flex items-center gap-2">
                    <Button size="icon" variant="ghost" className="size-8 rounded-full transition-all hover:bg-primary/10 hover:text-primary hover:scale-110" onClick={() => { }}>
                        <Eye className="size-4" />
                    </Button>
                    <Button
                        size="icon"
                        variant="ghost"
                        className={cn(
                            "size-8 rounded-full transition-all hover:scale-110",
                            isSelected ? "bg-primary/20 text-primary" : "hover:bg-primary/10 hover:text-primary"
                        )}
                        onClick={() => onEdit(item)}
                    >
                        <Edit className="size-4" />
                    </Button>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        size="icon"
                        variant="ghost"
                        className={cn(
                            "size-8 rounded-full transition-all border-none hover:scale-110",
                            isDisabled ? "text-amber-500 hover:bg-amber-500/10" : "text-blue-400 hover:bg-blue-400/10"
                        )}
                        onClick={() => onFreeze(item)}
                    >
                        {isDisabled ? <Flame className="size-4" /> : <Snowflake className="size-4" />}
                    </Button>
                    <Button
                        size="icon"
                        variant="ghost"
                        className="size-8 rounded-full transition-all text-destructive hover:bg-destructive/10 hover:scale-110 hover:rotate-6"
                        onClick={() => onDelete(item)}
                    >
                        <Trash2 className="size-4" />
                    </Button>
                </div>
            </div>
        </div>
    )
}
