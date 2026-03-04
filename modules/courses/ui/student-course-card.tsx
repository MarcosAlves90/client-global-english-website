"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  PauseCircle,
  Play,
  Target,
  Timer,
} from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { optimizeCloudinaryUrl } from "@/lib/cloudinary-url"
import { cn } from "@/lib/utils"
import type { DashboardCourse } from "@/lib/firebase/types"

interface StudentCourseCardProps {
  course: DashboardCourse
  variant?: "horizontal" | "vertical"
  className?: string
}

type StatusConfig = {
  label: string
  chipClass: string
  icon: React.ComponentType<{ className?: string }>
}

const statusConfigByKey: Record<string, StatusConfig> = {
  active: {
    label: "Em andamento",
    chipClass: "border-primary/25 bg-primary/10 text-primary",
    icon: Play,
  },
  completed: {
    label: "Concluido",
    chipClass: "border-emerald-500/25 bg-emerald-500/10 text-emerald-500",
    icon: CheckCircle2,
  },
  paused: {
    label: "Pausado",
    chipClass: "border-amber-500/25 bg-amber-500/10 text-amber-500",
    icon: PauseCircle,
  },
}

function getStatusConfig(status: string) {
  return statusConfigByKey[status] ?? statusConfigByKey.active
}

function getNextActionLabel(status: string, progress: number) {
  if (status === "completed" || progress >= 100) {
    return "Revisar conteudo"
  }
  if (status === "paused") {
    return "Retomar agora"
  }
  if (progress <= 0) {
    return "Iniciar jornada"
  }
  return "Continuar curso"
}

export function StudentCourseCard({
  course,
  variant = "vertical",
  className,
}: StudentCourseCardProps) {
  const [imageError, setImageError] = React.useState(false)
  const progress = Math.min(100, Math.max(0, Number(course.enrollment.progress ?? 0)))
  const totalActivities = course.activities.length
  const completedActivities = totalActivities
    ? Math.min(totalActivities, Math.round((totalActivities * progress) / 100))
    : 0
  const remainingActivities = Math.max(totalActivities - completedActivities, 0)
  const statusConfig = getStatusConfig(course.enrollment.status)
  const StatusIcon = statusConfig.icon
  const nextActionLabel = getNextActionLabel(course.enrollment.status, progress)

  if (variant === "horizontal") {
    return (
      <Card
        className={cn(
          "group overflow-hidden border-primary/15 bg-card/40 py-0 backdrop-blur-sm transition-all duration-300",
          "hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10",
          className
        )}
      >
        <CardContent className="space-y-4 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
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
                  {course.level}
                </span>
              </div>
              <h3 className="line-clamp-1 text-base font-bold tracking-tight text-foreground">
                {course.title}
              </h3>
              <p className="line-clamp-1 text-xs text-muted-foreground/75">
                {course.description || "Evolua com um plano de estudo estruturado."}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                Progresso
              </p>
              <p className="text-lg font-black tracking-tight text-primary">{progress}%</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="h-2 overflow-hidden rounded-full bg-primary/10">
              <div
                className="h-full rounded-full bg-primary transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground/80">
              <span>{completedActivities}/{totalActivities} atividades concluidas</span>
              <span>{remainingActivities} restantes</span>
            </div>
          </div>

          <Button size="sm" className="w-full rounded-full font-semibold" asChild>
            <Link href={`/dashboard/courses/${course.id}`}>
              {nextActionLabel}
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      className={cn(
        "group flex h-full flex-col overflow-hidden border-primary/15 bg-card/50 py-0 backdrop-blur-sm transition-all duration-300",
        "hover:-translate-y-1 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/10",
        className
      )}
    >
      <div className="relative aspect-16/10 w-full overflow-hidden border-b border-primary/15 bg-muted/30">
        {course.coverUrl && !imageError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={optimizeCloudinaryUrl(course.coverUrl, {
              width: 960,
              height: 600,
              crop: "fill",
              gravity: "auto",
            })}
            alt={course.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-primary/5">
            <BookOpen className="size-11 text-primary/25" />
          </div>
        )}

        <div className="absolute inset-0 bg-linear-to-t from-black/65 via-black/20 to-black/5" />

        <div className="absolute left-3 right-3 top-3 flex items-start justify-between gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest backdrop-blur-md",
              statusConfig.chipClass
            )}
          >
            <StatusIcon className="size-3" />
            {statusConfig.label}
          </span>
          <span className="rounded-full border border-white/15 bg-black/45 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white/95 backdrop-blur-md">
            {course.level}
          </span>
        </div>

        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70">
              Proxima acao
            </p>
            <p className="line-clamp-1 text-sm font-bold text-white">{nextActionLabel}</p>
          </div>
          <div className="shrink-0 rounded-xl border border-white/20 bg-black/40 px-2.5 py-1.5 text-right backdrop-blur-md">
            <p className="text-[9px] font-semibold uppercase tracking-widest text-white/70">Progresso</p>
            <p className="text-base font-black leading-tight text-white">{progress}%</p>
          </div>
        </div>
      </div>

      <CardContent className="flex flex-1 flex-col gap-4 p-5">
        <div className="space-y-1.5">
          <h3 className="line-clamp-1 text-lg font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
            {course.title}
          </h3>
          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground/80">
            {course.description || "Curso com trilha orientada para aplicacao pratica e evolucao consistente."}
          </p>
        </div>

        <div className="rounded-2xl border border-primary/10 bg-primary/5 p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
              Avanco da trilha
            </p>
            <p className="text-sm font-extrabold text-primary">{progress}%</p>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-primary/10">
            <div
              className="h-full rounded-full bg-primary transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground/80">
            <span>{completedActivities}/{totalActivities} concluidas</span>
            <span>{remainingActivities} restantes</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-primary/10 bg-background/70 p-2.5 text-center">
            <ClipboardList className="mx-auto mb-1 size-3.5 text-primary/80" />
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">Modulos</p>
            <p className="text-sm font-bold text-foreground">{course.tracks.length}</p>
          </div>
          <div className="rounded-xl border border-primary/10 bg-background/70 p-2.5 text-center">
            <Target className="mx-auto mb-1 size-3.5 text-primary/80" />
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">Atividades</p>
            <p className="text-sm font-bold text-foreground">{totalActivities}</p>
          </div>
          <div className="rounded-xl border border-primary/10 bg-background/70 p-2.5 text-center">
            <Timer className="mx-auto mb-1 size-3.5 text-primary/80" />
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">Duracao</p>
            <p className="text-sm font-bold text-foreground">{course.durationWeeks} sem</p>
          </div>
        </div>

        <Button className="mt-auto w-full rounded-full font-semibold shadow-lg shadow-primary/20" asChild>
          <Link href={`/dashboard/courses/${course.id}`}>
            {nextActionLabel}
            <ArrowRight className="ml-2 size-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
