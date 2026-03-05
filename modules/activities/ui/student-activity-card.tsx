"use client"

import * as React from "react"
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  FileText,
  PauseCircle,
  Play,
  Target,
  Video,
} from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface StudentActivityCardProps {
  activity: {
    id: string
    title: string
    courseTitle: string
    trackTitle?: string
    type: string
    estimatedMinutes: number
    status?: "pending" | "completed" | "in_progress"
  }
  variant?: "default" | "compact"
  className?: string
  onOpen?: (id: string) => void
  onComplete?: (id: string) => void
  canComplete?: boolean
  completeDisabledReason?: string
}

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  video: Video,
  quiz: Target,
  lesson: BookOpen,
  assignment: FileText,
  project: Target,
}

type StatusConfig = {
  label: string
  chipClass: string
  icon: React.ComponentType<{ className?: string }>
}

const statusConfigByKey: Record<string, StatusConfig> = {
  pending: {
    label: "Pendente",
    chipClass: "border-muted bg-muted text-muted-foreground",
    icon: PauseCircle,
  },
  in_progress: {
    label: "Em andamento",
    chipClass: "border-primary/25 bg-primary/10 text-primary",
    icon: Play,
  },
  completed: {
    label: "Concluída",
    chipClass: "border-emerald-500/25 bg-emerald-500/10 text-emerald-500",
    icon: CheckCircle2,
  },
}

function formatType(type: string) {
  if (!type) return "Atividade"
  return type.replace("_", " ")
}

function getPrimaryActionLabel(status: "pending" | "completed" | "in_progress") {
  if (status === "completed") return "Revisar atividade"
  if (status === "pending") return "Começar atividade"
  return "Continuar atividade"
}

export function StudentActivityCard({
  activity,
  variant = "default",
  className,
  onOpen,
  onComplete,
  canComplete = false,
  completeDisabledReason = "Disponível após finalizar a atividade.",
}: StudentActivityCardProps) {
  const Icon = typeIcons[activity.type] || BookOpen
  const status = activity.status || "in_progress"
  const statusConfig = statusConfigByKey[status] ?? statusConfigByKey.in_progress
  const StatusIcon = statusConfig.icon
  const actionLabel = getPrimaryActionLabel(status)
  const isCompleteActionDisabled =
    status === "completed" || !onComplete || !canComplete

  if (variant === "compact") {
    return (
      <Card
        className={cn(
          "group overflow-hidden border-primary/15 bg-card/45 py-0 backdrop-blur-sm transition-all duration-300",
          "hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10",
          className
        )}
      >
        <CardContent className="flex items-center justify-between gap-3 p-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="rounded-xl border border-primary/15 bg-primary/10 p-2 text-primary">
              <Icon className="size-4" />
            </div>
            <div className="min-w-0">
              <h4 className="line-clamp-1 text-sm font-bold tracking-tight text-foreground">{activity.title}</h4>
              <p className="line-clamp-1 text-[11px] text-muted-foreground/75">{activity.courseTitle}</p>
            </div>
          </div>
          <Button
            size="sm"
            className="shrink-0 rounded-full"
            onClick={() => onOpen?.(activity.id)}
          >
            Abrir
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      className={cn(
        "group flex h-full flex-col overflow-hidden border-primary/15 bg-card/50 py-0 backdrop-blur-sm transition-all duration-300",
        "hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10",
        className
      )}
    >
      <CardContent className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest",
                  statusConfig.chipClass
                )}
              >
                <StatusIcon className="size-3" />
                {statusConfig.label}
              </span>
              <span className="rounded-full border border-primary/10 bg-background/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/80">
                {formatType(activity.type)}
              </span>
            </div>
            <h3 className="line-clamp-2 text-base font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
              {activity.title}
            </h3>
            <p className="line-clamp-1 text-sm text-muted-foreground/75">
              {activity.courseTitle}
              {activity.trackTitle ? ` - ${activity.trackTitle}` : ""}
            </p>
          </div>
          <div className="rounded-2xl border border-primary/15 bg-primary/10 p-3 text-primary transition-transform duration-300 group-hover:scale-105">
            <Icon className="size-5" />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-primary/10 bg-primary/5 px-3 py-2.5">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground/80">
            <Clock className="size-3.5 text-primary/80" />
            Tempo estimado
          </span>
          <span className="text-sm font-bold text-foreground">{activity.estimatedMinutes || 15} min</span>
        </div>

        <div className="mt-auto grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button
            className="rounded-full font-semibold"
            onClick={() => onOpen?.(activity.id)}
          >
            {actionLabel}
            <ArrowRight className="ml-2 size-4" />
          </Button>
          <Button
            variant="outline"
            className="rounded-full font-semibold border-primary/20"
            onClick={() => onComplete?.(activity.id)}
            disabled={isCompleteActionDisabled}
            title={isCompleteActionDisabled ? completeDisabledReason : undefined}
          >
            <CheckCircle2 className="mr-2 size-4" />
            {status === "completed" ? "Concluída" : "Marcar concluída"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
