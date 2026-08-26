"use client"

import {
  BookOpen,
  Clock,
  FileText,
  Layers3,
  Target,
  Users2,
} from "lucide-react"

import { DashboardSectionHeader } from "@/components/dashboard/dashboard-section-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCourseManagement } from "./CourseManagementContext"

export function CourseOverview() {
  const { course, tracks, materials, activities } = useCourseManagement()

  if (!course) return null

  const stats = [
    { label: "Módulos", value: tracks.length, icon: Layers3, tone: "text-blue-500 bg-blue-500/10" },
    { label: "Materiais", value: materials.length, icon: FileText, tone: "text-purple-500 bg-purple-500/10" },
    { label: "Atividades", value: activities.length, icon: Target, tone: "text-emerald-500 bg-emerald-500/10" },
    {
      label: "Duração Est.",
      value: `${activities.reduce((acc, curr) => acc + (curr.estimatedMinutes || 0), 0)} min`,
      icon: Clock,
      tone: "text-amber-500 bg-amber-500/10",
    },
  ]

  return (
    <div className="space-y-6">
      <DashboardSectionHeader
        icon={BookOpen}
        title="Visão Geral"
        description="Resumo do curso, distribuição de conteúdo por módulo e métricas gerais."
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="ge-surface">
            <CardContent className="flex items-center justify-between gap-4 px-5 py-1">
              <div className={`flex size-10 items-center justify-center rounded-2xl ${stat.tone}`}>
                <stat.icon className="size-5" />
              </div>
              <div className="text-right">
                <p className="ge-kicker text-muted-foreground/65">{stat.label}</p>
                <p className="mt-1 text-2xl font-semibold tracking-[-0.04em]">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Resumo do Curso</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="ge-surface-muted flex items-start gap-4 p-4">
              <div className="ge-icon-tile size-12 shrink-0 rounded-full">
                <BookOpen className="size-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold leading-none tracking-[-0.025em]">{course.title}</h3>
                <p className="mt-2 line-clamp-3 text-xs leading-5 text-muted-foreground">
                  {course.description || "Nenhuma descrição fornecida para este curso."}
                </p>
              </div>
            </div>

            <div className="ge-inset p-4">
              <div className="mb-2 flex items-center gap-2">
                <Users2 className="size-3.5 text-primary/70" />
                <span className="ge-kicker text-muted-foreground/65">Status do Curso</span>
              </div>
              <p className="text-sm font-semibold text-foreground">{course.status || "Sem status definido"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Distribuição por Módulo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tracks.length === 0 ? (
                <p className="ge-surface-muted py-8 text-center text-xs italic text-muted-foreground">
                  Nenhum módulo cadastrado ainda.
                </p>
              ) : (
                tracks.slice(0, 5).map((track) => {
                  const materialCount = materials.filter((material) => material.trackId === track.id).length
                  const activityCount = activities.filter((activity) => activity.trackId === track.id).length

                  return (
                    <div key={track.id} className="ge-inset flex items-center justify-between gap-3 p-3 transition-colors hover:border-primary/20">
                      <div className="min-w-0">
                        <span className="ge-kicker mb-1 block">Módulo {track.order}</span>
                        <span className="block truncate text-xs font-semibold">{track.title}</span>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <span className="ge-chip">{materialCount} mat.</span>
                        <span className="ge-chip">{activityCount} ativ.</span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
