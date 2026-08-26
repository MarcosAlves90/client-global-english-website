import Image from "next/image"
import { Bot, Edit, Flame, GraduationCap, MoreHorizontal, ShieldCheck, Snowflake, Trash2, User } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { optimizeCloudinaryUrl } from "@/lib/cloudinary-url"
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
  const isTeacher = item.role === "teacher"
  const isDisabled = item.disabled

  return (
    <Card
      className={cn(
        "ge-surface gap-0 overflow-hidden py-0 transition-colors hover:border-primary/20",
        isSelected && "border-primary/35 bg-primary/5",
        isDisabled && "opacity-70"
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted text-muted-foreground",
              isAdmin && "bg-primary/10 text-primary"
            )}
          >
            {item.photoURL ? (
              <Image
                src={optimizeCloudinaryUrl(item.photoURL, {
                  width: 88,
                  height: 88,
                  crop: "fill",
                  gravity: "auto",
                })}
                alt={item.name}
                fill
                className="object-cover"
              />
            ) : isAdmin ? (
              <ShieldCheck className="size-4" />
            ) : isTeacher ? (
              <GraduationCap className="size-4" />
            ) : (
              <User className="size-4" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-semibold text-foreground">{item.name}</p>
              {item.isRobot ? <Bot className="size-3.5 shrink-0 text-amber-600" aria-label="Conta automatizada" /> : null}
            </div>
            <p className="truncate text-xs text-muted-foreground">{item.email}</p>
            {item.team ? <p className="mt-1 truncate text-xs text-muted-foreground">{item.team}</p> : null}
          </div>

          <MoreHorizontal className="mt-1 size-4 shrink-0 text-muted-foreground/60" aria-hidden="true" />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Badge variant="outline" className={isAdmin ? "border-primary/20 bg-primary/8 text-primary" : undefined}>
            {ROLE_LABELS[item.role]}
          </Badge>
          <Badge
            variant="outline"
            className={isDisabled ? "border-amber-500/20 bg-amber-500/8 text-amber-700 dark:text-amber-400" : "border-emerald-500/20 bg-emerald-500/8 text-emerald-700 dark:text-emerald-400"}
          >
            {isDisabled ? "Desativado" : "Ativo"}
          </Badge>
        </div>

        <div className="mt-4 flex items-center justify-between gap-2 border-t border-border/70 pt-3">
          <Button
            size="sm"
            variant={isSelected ? "secondary" : "outline"}
            onClick={() => onEdit(item)}
            aria-label={`Editar ${item.name}`}
          >
            <Edit className="mr-2 size-3.5" />
            Editar
          </Button>

          <div className="flex items-center gap-1">
            <Button
              size="icon-sm"
              variant="ghost"
              className={isDisabled ? "text-amber-600" : "text-muted-foreground"}
              onClick={() => onFreeze(item)}
              aria-label={isDisabled ? `Reativar ${item.name}` : `Desativar ${item.name}`}
            >
              {isDisabled ? <Flame className="size-4" /> : <Snowflake className="size-4" />}
            </Button>
            <Button
              size="icon-sm"
              variant="ghost"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => onDelete(item)}
              aria-label={`Excluir ${item.name}`}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
