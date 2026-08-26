"use client"

import * as React from "react"
import Link from "next/link"
import { BookOpenCheck, ClipboardList, Layers3, MoreHorizontal, Pencil, Trash2, Users2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { optimizeCloudinaryUrl } from "@/lib/cloudinary-url"
import type { AdminCourseSummary } from "@/lib/firebase/types"

type AdminCourseCardProps = {
  course: AdminCourseSummary
  onDelete: (course: AdminCourseSummary) => void
  deleting?: boolean
}

export function AdminCourseCard({ course, onDelete, deleting = false }: AdminCourseCardProps) {
  const [imageError, setImageError] = React.useState(false)

  React.useEffect(() => {
    setImageError(false)
  }, [course.coverUrl])

  return (
    <Card className="ge-surface group flex h-full flex-col overflow-hidden py-0 transition-colors hover:border-primary/20">
      <div className="relative aspect-[16/9] w-full overflow-hidden border-b border-border/70 bg-muted">
        {course.coverUrl && !imageError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={optimizeCloudinaryUrl(course.coverUrl, {
              width: 960,
              height: 540,
              crop: "fill",
              gravity: "auto",
            })}
            alt={course.title}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.01]"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted">
            <div className="ge-icon-tile size-12">
              <BookOpenCheck className="size-5" />
            </div>
          </div>
        )}
      </div>

      <CardContent className="flex flex-1 flex-col p-4">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-1 text-base font-semibold text-foreground">{course.title}</h3>
            <p className="mt-1 line-clamp-2 min-h-10 text-xs leading-5 text-muted-foreground">
              {course.description || "Sem descrição."}
            </p>
          </div>
          <MoreHorizontal className="mt-1 size-4 shrink-0 text-muted-foreground/60" aria-hidden="true" />
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <Badge variant="outline">{course.level}</Badge>
          <Badge variant="outline" className="border-primary/15 bg-primary/5 text-primary">
            {course.status}
          </Badge>
        </div>

        <div className="mt-4 grid grid-cols-3 divide-x divide-border/70 rounded-2xl border border-border/70 bg-muted/35 py-2">
          <AdminCourseMetric icon={Users2} label="Alunos" value={course.studentsCount} />
          <AdminCourseMetric icon={Layers3} label="Módulos" value={course.modulesCount} />
          <AdminCourseMetric icon={ClipboardList} label="Atividades" value={course.activitiesCount} />
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 pt-4">
          <Button size="sm" asChild>
            <Link href={`/dashboard/admin/courses/${course.id}`}>Abrir curso</Link>
          </Button>
          <div className="flex items-center gap-1">
            <Button
              size="icon-sm"
              variant="ghost"
              className="text-muted-foreground"
              asChild
            >
              <Link href={`/dashboard/admin/courses/${course.id}?edit=1`} aria-label={`Editar ${course.title}`}>
                <Pencil className="size-4" />
              </Link>
            </Button>
            <Button
              size="icon-sm"
              variant="ghost"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => onDelete(course)}
              disabled={deleting}
              aria-label={`Excluir ${course.title}`}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function AdminCourseMetric({ icon: Icon, label, value }: Readonly<{ icon: React.ComponentType<{ className?: string }>; label: string; value: React.ReactNode }>) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-0.5 px-2 text-center">
      <Icon className="size-3.5 text-muted-foreground" />
      <span className="text-sm font-semibold text-foreground">{value}</span>
      <span className="text-[11px] text-muted-foreground">{label}</span>
    </div>
  )
}
