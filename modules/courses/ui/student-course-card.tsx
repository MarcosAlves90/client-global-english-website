"use client"

import * as React from "react"
import Link from "next/link"
import {
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Layers,
  PauseCircle,
  Play,
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
    label: "Concluído",
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

function getActionLabel(status: string) {
  if (status === "completed") {
    return "Revisar atividades"
  }
  if (status === "paused") {
    return "Retomar estudos"
  }
  return "Abrir atividades"
}

export function StudentCourseCard({
  course,
  variant = "vertical",
  className,
}: StudentCourseCardProps) {
  const [imageError, setImageError] = React.useState(false)
  const totalActivities = course.activities.length
  const totalModules = course.tracks.length
  const statusConfig = getStatusConfig(course.enrollment.status)
  const StatusIcon = statusConfig.icon
  const actionLabel = getActionLabel(course.enrollment.status)

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
                {course.description || "Conteúdo disponível para seu desenvolvimento contínuo."}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Status</p>
              <p className="text-sm font-bold tracking-tight text-primary">{statusConfig.label}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-primary/10 bg-primary/5 p-2 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">Módulos</p>
              <p className="text-sm font-bold text-foreground">{totalModules}</p>
            </div>
            <div className="rounded-lg border border-primary/10 bg-primary/5 p-2 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">Atividades</p>
              <p className="text-sm font-bold text-foreground">{totalActivities}</p>
            </div>
          </div>

          <Button size="sm" className="w-full rounded-full font-semibold" asChild>
            <Link href="/dashboard/activities">
              {actionLabel}
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
            <p className="line-clamp-1 text-sm font-bold text-white">{course.title}</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70">
              {totalModules} módulo(s) • {totalActivities} atividade(s)
            </p>
          </div>
        </div>
      </div>

      <CardContent className="flex flex-1 flex-col gap-4 p-5 pt-0">
        <div className="space-y-1.5">
          <h3 className="line-clamp-1 text-lg font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
            {course.title}
          </h3>
          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground/80">
            {course.description || "Curso com conteúdos organizados para aplicação prática."}
          </p>
        </div>

        <div className="rounded-2xl border border-primary/10 bg-primary/5 p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
              Resumo do curso
            </p>
            <p className="text-sm font-extrabold text-primary">{statusConfig.label}</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground/80">
            <div className="rounded-lg border border-primary/10 bg-background/70 p-2 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">Módulos</p>
              <p className="text-sm font-bold text-foreground">{totalModules}</p>
            </div>
            <div className="rounded-lg border border-primary/10 bg-background/70 p-2 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">Atividades</p>
              <p className="text-sm font-bold text-foreground">{totalActivities}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-primary/10 bg-background/70 p-2.5 text-center">
            <Layers className="mx-auto mb-1 size-3.5 text-primary/80" />
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">Nível</p>
            <p className="text-sm font-bold text-foreground">{course.level}</p>
          </div>
          <div className="rounded-xl border border-primary/10 bg-background/70 p-2.5 text-center">
            <ClipboardList className="mx-auto mb-1 size-3.5 text-primary/80" />
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">Duração</p>
            <p className="text-sm font-bold text-foreground">{course.durationWeeks} sem</p>
          </div>
        </div>

        <Button className="mt-auto w-full rounded-full font-semibold shadow-lg shadow-primary/20" asChild>
          <Link href="/dashboard/activities">
            {actionLabel}
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
