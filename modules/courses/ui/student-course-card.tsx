"use client"

import * as React from "react"
import Link from "next/link"
import { BookOpen, CheckCircle2, PauseCircle, Play } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { DashboardCourse } from "@/lib/firebase/types"
import { optimizeCloudinaryUrl } from "@/lib/cloudinary-url"
import { cn } from "@/lib/utils"

interface StudentCourseCardProps { course: DashboardCourse; variant?: "horizontal" | "vertical"; className?: string }
const statusConfig = {
  active: { label: "Em andamento", icon: Play, className: "text-primary" },
  completed: { label: "Concluído", icon: CheckCircle2, className: "text-emerald-600 dark:text-emerald-400" },
  paused: { label: "Pausado", icon: PauseCircle, className: "text-amber-600 dark:text-amber-400" },
} as const

export function StudentCourseCard({ course, variant = "vertical", className }: StudentCourseCardProps) {
  const [imageError, setImageError] = React.useState(false)
  const status = statusConfig[course.enrollment.status] ?? statusConfig.active
  const Icon = status.icon
  const progress = Math.max(0, Math.min(100, Math.round(Number(course.enrollment.progress) || 0)))

  if (variant === "horizontal") {
    return (
      <Card className={cn("py-0", className)}>
        <CardContent className="flex items-center gap-4 p-4">
          <div className="ge-icon-tile size-11 shrink-0"><BookOpen className="size-5" /></div>
          <div className="min-w-0 flex-1"><p className="truncate font-semibold">{course.title}</p><p className="mt-0.5 text-xs text-muted-foreground">{course.level} · {progress}% concluído</p></div>
          <Button asChild size="sm"><Link href={`/dashboard/courses/${course.id}`}>Continuar</Link></Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("group h-full overflow-hidden py-0", className)}>
      <div className="aspect-[16/9] overflow-hidden border-b border-border bg-muted/50">
        {course.coverUrl && !imageError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={optimizeCloudinaryUrl(course.coverUrl, { width: 960, height: 540, crop: "fill", gravity: "auto" })} alt={course.title} loading="lazy" decoding="async" onError={() => setImageError(true)} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
        ) : <div className="flex h-full items-center justify-center"><div className="ge-icon-tile size-14"><BookOpen className="size-6" /></div></div>}
      </div>
      <CardContent className="flex h-full flex-col gap-4 p-5">
        <div><div className="flex items-center justify-between gap-2"><span className="text-xs font-medium text-muted-foreground">{course.level}</span><span className={cn("inline-flex items-center gap-1 text-xs font-medium", status.className)}><Icon className="size-3.5" />{status.label}</span></div><h3 className="mt-1 text-lg font-semibold tracking-[-0.02em]">{course.title}</h3><p className="mt-1 line-clamp-2 text-sm leading-5 text-muted-foreground">{course.description || "Conteúdo organizado por módulos e atividades."}</p></div>
        <div><div className="flex items-center justify-between text-xs text-muted-foreground"><span>Progresso</span><span className="font-medium text-foreground">{progress}%</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} /></div></div>
        <div className="mt-auto flex items-center justify-between gap-3 text-xs text-muted-foreground"><span>{course.tracks.length} módulos · {course.activities.length} atividades</span><Button asChild size="sm"><Link href={`/dashboard/courses/${course.id}`}>{course.enrollment.status === "completed" ? "Revisar" : "Continuar"}</Link></Button></div>
      </CardContent>
    </Card>
  )
}
