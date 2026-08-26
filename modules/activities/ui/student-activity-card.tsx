"use client"

import { AlertTriangle, ArrowRight, BookOpen, CalendarClock, CheckCircle2, Clock, FileText, Play, RotateCcw, Target } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { getActivityTiming, parseActivityDate } from "@/lib/activities/deadlines"
import { cn } from "@/lib/utils"

interface StudentActivityCardProps {
  activity: { id: string; title: string; courseTitle: string; trackTitle?: string; type: string; estimatedMinutes: number; dueAt?: Date | string | null; closeAt?: Date | string | null; status?: "pending" | "completed" | "in_progress"; gradingStatus?: "pending" | "revision_requested" | "graded" }
  variant?: "default" | "compact"
  className?: string
  onOpen?: (id: string) => void
  onComplete?: (id: string) => void
  canComplete?: boolean
  completeDisabledReason?: string
}
const icons = { quiz: Target, lesson: BookOpen, assignment: FileText, project: Target } as const
function formatDeadline(value: Date | string | null | undefined) { const date = parseActivityDate(value); return date ? new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(date) : null }

export function StudentActivityCard({ activity, variant = "default", className, onOpen }: StudentActivityCardProps) {
  const status = activity.status ?? "pending"
  const revision = activity.gradingStatus === "revision_requested"
  const timing = getActivityTiming(activity)
  const deadline = formatDeadline(activity.dueAt)
  const Icon = icons[activity.type as keyof typeof icons] ?? BookOpen
  const statusLabel = revision ? "Revisão solicitada" : status === "completed" ? "Concluída" : status === "in_progress" ? "Em andamento" : "Pendente"
  const StatusIcon = revision ? RotateCcw : status === "completed" ? CheckCircle2 : status === "in_progress" ? Play : Clock
  const statusClass = revision ? "text-amber-600 dark:text-amber-400" : status === "completed" ? "text-emerald-600 dark:text-emerald-400" : status === "in_progress" ? "text-primary" : "text-muted-foreground"
  const actionLabel = revision ? "Revisar" : status === "completed" ? "Abrir" : status === "in_progress" ? "Continuar" : "Começar"

  return (
    <Card className={cn("py-0", variant === "compact" && "shadow-none", className)}>
      <CardContent className={cn("flex items-center gap-3 p-4", variant === "default" && "sm:gap-4")}>
        <div className="ge-icon-tile size-10 shrink-0"><Icon className="size-4.5" /></div>
        <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-x-2 gap-y-1"><h3 className="truncate text-sm font-semibold">{activity.title}</h3><span className={cn("inline-flex items-center gap-1 text-xs font-medium", statusClass)}><StatusIcon className="size-3.5" />{statusLabel}</span></div><p className="mt-0.5 truncate text-xs text-muted-foreground">{activity.courseTitle}{activity.trackTitle ? ` · ${activity.trackTitle}` : ""}</p>{deadline ? <p className={cn("mt-1 inline-flex items-center gap-1 text-xs", status !== "completed" && timing.isOverdue ? "text-destructive" : "text-muted-foreground")} >{status !== "completed" && timing.isOverdue ? <AlertTriangle className="size-3" /> : <CalendarClock className="size-3" />}{status !== "completed" && timing.isOverdue ? "Prazo vencido" : deadline}</p> : null}</div>
        {variant === "default" && activity.estimatedMinutes > 0 ? <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">{activity.estimatedMinutes} min</span> : null}
        <Button size="sm" variant={revision ? "default" : "outline"} onClick={() => onOpen?.(activity.id)} className="shrink-0">{actionLabel}<ArrowRight className="size-3.5" /></Button>
      </CardContent>
    </Card>
  )
}
