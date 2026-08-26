"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, ClipboardList, Layers3, Pencil, Settings2, Users2 } from "lucide-react"
import { toast } from "sonner"

import { DashboardNotice } from "@/components/dashboard/dashboard-feedback"
import { DashboardPage } from "@/components/dashboard/dashboard-page"
import { DashboardSectionHeader } from "@/components/dashboard/dashboard-section-header"
import { DashboardStatCard } from "@/components/dashboard/dashboard-stat-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/hooks/use-auth"
import { deleteMediaByUrl } from "@/lib/cloudinary-actions"
import type { AdminCourseSummary, AdminUserSummary } from "@/lib/firebase/types"
import { fetchAdminCourses, saveAdminCourse } from "@/modules/courses"
import {
  AdminCourseForm,
  createAdminCourseFormValue,
  type AdminCourseFormValue,
} from "@/modules/courses/ui/admin-course-form"
import { fetchAdminTeachers } from "@/modules/users"

export default function Page() {
  const { role, isFirebaseReady, user } = useAuth()
  const params = useParams<{ courseId?: string }>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const courseId = Array.isArray(params?.courseId) ? params.courseId[0] : params?.courseId

  const [course, setCourse] = React.useState<AdminCourseSummary | null>(null)
  const [teachers, setTeachers] = React.useState<AdminUserSummary[]>([])
  const [form, setForm] = React.useState<AdminCourseFormValue>(() => createAdminCourseFormValue())
  const [editing, setEditing] = React.useState(searchParams.get("edit") === "1")
  const [loadingCourse, setLoadingCourse] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [editError, setEditError] = React.useState<string | null>(null)

  const breadcrumbItems = React.useMemo(
    () => [
      { label: "Admin", href: "/dashboard/admin" },
      { label: "Cursos", href: "/dashboard/admin/courses" },
      { label: course?.title ?? "Curso" },
    ],
    [course?.title]
  )

  const loadCourse = React.useCallback(async (force?: boolean) => {
    if (!courseId) {
      setError("Curso inválido.")
      return
    }

    try {
      setLoadingCourse(true)
      setError(null)
      const data = await fetchAdminCourses(user ? await user.getIdToken() : null, { force })
      const match = data.find((item) => item.id === courseId) ?? null
      setCourse(match)
      if (match) setForm(createAdminCourseFormValue(match))
      if (!match) setError("Curso não encontrado.")
    } catch {
      setError("Não foi possível carregar o curso.")
    } finally {
      setLoadingCourse(false)
    }
  }, [courseId, user])

  React.useEffect(() => {
    if (!isFirebaseReady || role !== "admin") return
    void loadCourse()
  }, [isFirebaseReady, role, loadCourse])

  React.useEffect(() => {
    async function loadTeachers() {
      if (!isFirebaseReady || role !== "admin" || !user) return
      try {
        setTeachers(await fetchAdminTeachers(await user.getIdToken()))
      } catch {
        setTeachers([])
      }
    }
    void loadTeachers()
  }, [isFirebaseReady, role, user])


  const closeEditor = React.useCallback(async () => {
    const persistedCoverUrl = course?.coverUrl ?? ""
    if (form.coverUrl && form.coverUrl !== persistedCoverUrl) {
      try {
        await deleteMediaByUrl(form.coverUrl)
      } catch (cleanupError) {
        console.error("Unsaved course cover cleanup failed", cleanupError)
      }
    }
    setEditing(false)
    setEditError(null)
    setForm(createAdminCourseFormValue(course))
    if (courseId) router.replace(`/dashboard/admin/courses/${courseId}`)
  }, [course, courseId, form.coverUrl, router])

  const handleSave = async () => {
    if (!courseId || !form.title.trim() || !form.description.trim()) {
      setEditError("Título e descrição são obrigatórios.")
      return
    }
    const durationWeeks = Number(form.durationWeeks)
    if (!Number.isFinite(durationWeeks) || durationWeeks <= 0) {
      setEditError("Duração deve ser um número maior que zero.")
      return
    }

    const previousCoverUrl = course?.coverUrl ?? ""

    try {
      setSaving(true)
      setEditError(null)
      await saveAdminCourse(user ? await user.getIdToken() : null, {
        id: courseId,
        title: form.title.trim(),
        description: form.description.trim(),
        level: form.level,
        durationWeeks,
        coverUrl: form.coverUrl.trim() || null,
        status: form.status,
        teacherIds: form.teacherIds,
      })
      if (previousCoverUrl && form.coverUrl !== previousCoverUrl) {
        try {
          await deleteMediaByUrl(previousCoverUrl)
        } catch (cleanupError) {
          console.error("Previous course cover cleanup failed", cleanupError)
        }
      }
      await loadCourse(true)
      toast.success("Curso atualizado")
      setEditing(false)
      router.replace(`/dashboard/admin/courses/${courseId}`)
    } catch {
      setEditError("Não foi possível salvar o curso.")
    } finally {
      setSaving(false)
    }
  }

  if (role !== "admin") {
    return (
      <DashboardPage title="Curso" description="Área administrativa do curso.">
        <DashboardNotice tone="danger">Esta área é exclusiva para administradores.</DashboardNotice>
      </DashboardPage>
    )
  }

  return (
    <DashboardPage
      title={course?.title ?? "Curso"}
      breadcrumbItems={breadcrumbItems}
      description="Consulte e edite os dados do curso no próprio contexto antes de gerenciar sua estrutura."
      action={
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
            <Link href="/dashboard/admin/courses">
              <ArrowLeft className="size-4" />
              Cursos
            </Link>
          </Button>
          <Button
            type="button"
            variant={editing ? "outline" : "default"}
            size="sm"
            disabled={!course}
            onClick={() => {
              if (editing) void closeEditor()
              else {
                setEditing(true)
                router.replace(`/dashboard/admin/courses/${courseId}?edit=1`)
              }
            }}
          >
            <Pencil className="size-4" />
            {editing ? "Fechar edição" : "Editar curso"}
          </Button>
          <Button asChild size="sm" disabled={!courseId}>
            <Link href={`/dashboard/admin/courses/${courseId}/manage`}>
              <Settings2 className="size-4" />
              Gerenciar curso
            </Link>
          </Button>
        </div>
      }
      contentClassName="gap-6"
    >
      {!isFirebaseReady ? <DashboardNotice>Firebase não configurado. Os dados administrativos estão indisponíveis.</DashboardNotice> : null}
      {error ? <DashboardNotice tone="danger">{error}</DashboardNotice> : null}

      {editing && course ? (
        <section className="space-y-4">
          <DashboardSectionHeader
            title="Editar curso"
            description="Atualize os dados básicos e professores responsáveis sem sair do curso."
            icon={Pencil}
          />
          <AdminCourseForm
            title="Dados do curso"
            value={form}
            teachers={teachers}
            submitting={saving}
            error={editError}
            submitLabel="Salvar alterações"
            onChange={setForm}
            onSubmit={() => void handleSave()}
            initialCoverUrl={course.coverUrl}
            onCancel={() => void closeEditor()}
          />
        </section>
      ) : (
        <Card>
          <CardHeader><CardTitle className="text-lg">Visão geral</CardTitle></CardHeader>
          <CardContent className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="space-y-3">
              {loadingCourse ? (
                <div className="space-y-2" aria-label="Carregando curso">
                  <div className="h-4 w-3/4 animate-pulse rounded-md bg-muted" />
                  <div className="h-4 w-1/2 animate-pulse rounded-md bg-muted" />
                </div>
              ) : (
                <>
                  <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{course?.description || "Este curso ainda não possui descrição."}</p>
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="ge-chip">{course?.level ?? "Nível não definido"}</span>
                    <span className="ge-chip">{course?.status ?? "Status não definido"}</span>
                    <span className="ge-chip">{course ? `${course.durationWeeks} semanas` : "—"}</span>
                  </div>
                </>
              )}
            </div>
            <p className="max-w-sm text-xs leading-5 text-muted-foreground">
              Use “Editar curso” para dados básicos e “Gerenciar curso” para módulos, materiais e atividades.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <DashboardStatCard title="Alunos vinculados" value={course?.studentsCount ?? "—"} icon={Users2} loading={loadingCourse} />
        <DashboardStatCard title="Módulos" value={course?.modulesCount ?? "—"} icon={Layers3} loading={loadingCourse} />
        <DashboardStatCard title="Atividades" value={course?.activitiesCount ?? "—"} icon={ClipboardList} loading={loadingCourse} />
      </div>
    </DashboardPage>
  )
}
