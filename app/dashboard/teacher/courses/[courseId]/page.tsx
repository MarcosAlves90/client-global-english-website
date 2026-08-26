"use client"

import * as React from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, ClipboardList, Layers3, Plus, Users2 } from "lucide-react"
import { toast } from "sonner"

import { DashboardNotice } from "@/components/dashboard/dashboard-feedback"
import { DashboardPage } from "@/components/dashboard/dashboard-page"
import { DashboardStatCard } from "@/components/dashboard/dashboard-stat-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/hooks/use-auth"
import { createCourseActivity } from "@/modules/activities"
import { fetchTeacherCourseWorkspace } from "@/modules/courses"
import { toCreateCourseActivityPayload } from "@/modules/courses/model/activity-form"
import { ActivityCreator } from "@/modules/courses/ui/manage/ActivityCreator"
import { ManagementGrid } from "@/modules/courses/ui/manage/ManagementGrid"
import type { ActivityForm } from "@/modules/courses/ui/manage/courseManagement.types"
import type { TeacherCourseWorkspace } from "@/lib/contracts/teacher"

export default function Page() {
  const params = useParams<{ courseId?: string }>()
  const courseId = Array.isArray(params?.courseId) ? params.courseId[0] : params?.courseId ?? ""
  const { role, user, isFirebaseReady } = useAuth()
  const [workspace, setWorkspace] = React.useState<TeacherCourseWorkspace | null>(null)
  const [showCreate, setShowCreate] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const loadWorkspace = React.useCallback(async () => {
    if (!user || !courseId || !isFirebaseReady || (role !== "teacher" && role !== "admin")) return
    try {
      setLoading(true)
      setError(null)
      setWorkspace(await fetchTeacherCourseWorkspace(await user.getIdToken(), courseId))
    } catch {
      setError("Não foi possível carregar este curso docente.")
    } finally {
      setLoading(false)
    }
  }, [courseId, isFirebaseReady, role, user])

  React.useEffect(() => {
    void loadWorkspace()
  }, [loadWorkspace])

  const handleCreateActivity = React.useCallback(async (form: ActivityForm) => {
    if (!user || !courseId) return false
    try {
      await createCourseActivity(
        await user.getIdToken(),
        toCreateCourseActivityPayload(courseId, form)
      )
      toast.success("Atividade criada para o curso")
      await loadWorkspace()
      return true
    } catch {
      toast.error("Não foi possível criar a atividade")
      return false
    }
  }, [courseId, loadWorkspace, user])

  if (role !== "teacher" && role !== "admin") {
    return (
      <DashboardPage title="Curso" description="Área docente do curso.">
        <DashboardNotice tone="danger">Acesso exclusivo para professores e administradores.</DashboardNotice>
      </DashboardPage>
    )
  }

  const course = workspace?.course ?? null
  const trackById = new Map((workspace?.tracks ?? []).map((track) => [track.id, track.title]))

  return (
    <DashboardPage
      title={course?.title ?? "Curso docente"}
      description="Crie atividades para os alunos dentro do contexto do curso atribuído à sua conta."
      breadcrumbItems={[
        { label: "Professor", href: "/dashboard/teacher" },
        { label: course?.title ?? "Curso" },
      ]}
      action={
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
            <Link href="/dashboard/teacher">
              <ArrowLeft className="size-4" />
              Professor
            </Link>
          </Button>
          <Button
            size="sm"
            onClick={() => setShowCreate((current) => !current)}
            disabled={!workspace || workspace.tracks.length === 0}
          >
            <Plus className="size-4" />
            {showCreate ? "Fechar criação" : "Nova atividade"}
          </Button>
        </div>
      }
      contentClassName="gap-6"
    >
      {error ? <DashboardNotice tone="danger">{error}</DashboardNotice> : null}
      {loading && !workspace ? <DashboardNotice className="animate-pulse">Carregando curso...</DashboardNotice> : null}

      {workspace ? (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <DashboardStatCard title="Módulos" value={workspace.tracks.length} icon={Layers3} loading={loading} />
            <DashboardStatCard title="Alunos" value={workspace.students.length} icon={Users2} loading={loading} />
            <DashboardStatCard title="Atividades" value={workspace.activities.length} icon={ClipboardList} loading={loading} />
          </div>

          {workspace.tracks.length === 0 ? (
            <DashboardNotice>
              Este curso ainda não possui módulos. Um administrador precisa criar ao menos um módulo antes que atividades possam ser adicionadas.
            </DashboardNotice>
          ) : null}

          <ManagementGrid showCreatePanel={showCreate && workspace.tracks.length > 0}>
            {showCreate && workspace.tracks.length > 0 ? (
              <ActivityCreator
                tracks={workspace.tracks}
                availableUsers={workspace.students}
                onCreate={handleCreateActivity}
              />
            ) : null}

            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="text-base">Atividades do curso</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Atividades já disponíveis no curso. A criação usa os mesmos controles do gerenciamento administrativo.
                </p>
              </CardHeader>
              <CardContent className="space-y-2">
                {workspace.activities.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma atividade cadastrada.</p>
                ) : (
                  workspace.activities.map((activity) => (
                    <div key={activity.id} className="ge-inset flex items-start justify-between gap-3 p-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{activity.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {trackById.get(activity.trackId) ?? "Módulo"} · {activity.estimatedMinutes} min
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-wrap justify-end gap-1">
                        <span className="ge-chip">{activity.type}</span>
                        <span className="ge-chip">{activity.questions?.length ?? 0} questões</span>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </ManagementGrid>
        </>
      ) : null}
    </DashboardPage>
  )
}
