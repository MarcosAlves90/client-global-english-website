"use client"

import * as React from "react"
import { BookOpenCheck, ClipboardList, Layers3, Plus, Users2 } from "lucide-react"

import { DashboardNotice } from "@/components/dashboard/dashboard-feedback"
import { DashboardPage } from "@/components/dashboard/dashboard-page"
import { DashboardSectionHeader } from "@/components/dashboard/dashboard-section-header"
import { DashboardStatCard } from "@/components/dashboard/dashboard-stat-card"
import { SearchField } from "@/components/dashboard/search-field"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { NativeSelect } from "@/components/ui/native-select"
import { useAuth } from "@/hooks/use-auth"
import { deleteMediaByUrl } from "@/lib/cloudinary-actions"
import type { AdminCourseCatalogMetrics, AdminCourseSummary, AdminUserSummary } from "@/lib/firebase/types"
import {
  AdminCourseCard,
  deleteAdminCourse,
  fetchAdminCourseCatalog,
  saveAdminCourse,
} from "@/modules/courses"
import {
  AdminCourseForm,
  createAdminCourseFormValue,
  type AdminCourseFormValue,
} from "@/modules/courses/ui/admin-course-form"
import { fetchAdminTeachers } from "@/modules/users"

export default function Page() {
  const { role, isFirebaseReady, user } = useAuth()
  const [courses, setCourses] = React.useState<AdminCourseSummary[]>([])
  const [metrics, setMetrics] = React.useState<AdminCourseCatalogMetrics>({
    coursesCount: 0,
    uniqueStudentsCount: 0,
    modulesCount: 0,
    activitiesCount: 0,
  })
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [showCreate, setShowCreate] = React.useState(false)
  const [creating, setCreating] = React.useState(false)
  const [createError, setCreateError] = React.useState<string | null>(null)
  const [deleteError, setDeleteError] = React.useState<string | null>(null)
  const [deletingCourseId, setDeletingCourseId] = React.useState<string | null>(null)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [levelFilter, setLevelFilter] = React.useState<"all" | AdminCourseFormValue["level"]>("all")
  const [teachers, setTeachers] = React.useState<AdminUserSummary[]>([])
  const [form, setForm] = React.useState<AdminCourseFormValue>(() => createAdminCourseFormValue())

  const breadcrumbItems = React.useMemo(
    () => [{ label: "Admin", href: "/dashboard/admin" }, { label: "Cursos" }],
    []
  )

  const resetForm = React.useCallback(() => {
    setForm(createAdminCourseFormValue())
    setCreateError(null)
  }, [])

  const discardCreateDraft = React.useCallback(async () => {
    if (form.coverUrl) {
      try {
        await deleteMediaByUrl(form.coverUrl)
      } catch (cleanupError) {
        console.error("Course cover draft cleanup failed", cleanupError)
      }
    }
    resetForm()
  }, [form.coverUrl, resetForm])

  const loadCourses = React.useCallback(async (force?: boolean) => {
    try {
      setLoading(true)
      setError(null)
      const idToken = user ? await user.getIdToken() : null
      const data = await fetchAdminCourseCatalog(idToken, { force })
      setCourses(data.items)
      setMetrics(data.metrics)
    } catch {
      setError("Não foi possível carregar os cursos.")
    } finally {
      setLoading(false)
    }
  }, [user])

  React.useEffect(() => {
    if (!isFirebaseReady || role !== "admin") return
    void loadCourses()
  }, [isFirebaseReady, role, loadCourses])

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

  const handleSubmitCourse = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      setCreateError("Título e descrição são obrigatórios.")
      return
    }

    const durationWeeks = Number(form.durationWeeks)
    if (!Number.isFinite(durationWeeks) || durationWeeks <= 0) {
      setCreateError("Duração deve ser um número maior que zero.")
      return
    }

    try {
      setCreating(true)
      setCreateError(null)
      await saveAdminCourse(user ? await user.getIdToken() : null, {
        title: form.title.trim(),
        description: form.description.trim(),
        level: form.level,
        durationWeeks,
        coverUrl: form.coverUrl.trim() || null,
        status: form.status,
        teacherIds: form.teacherIds,
      })
      resetForm()
      setShowCreate(false)
      await loadCourses(true)
    } catch {
      setCreateError("Não foi possível criar o curso.")
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteCourse = async (course: AdminCourseSummary) => {
    if (!window.confirm(`Tem certeza que deseja excluir o curso "${course.title}"? Esta ação removerá módulos, materiais e atividades relacionadas.`)) {
      return
    }

    try {
      setDeletingCourseId(course.id)
      setDeleteError(null)
      await deleteAdminCourse(user ? await user.getIdToken() : null, course.id)
      await loadCourses(true)
    } catch {
      setDeleteError("Não foi possível excluir o curso.")
    } finally {
      setDeletingCourseId(null)
    }
  }

  const filteredCourses = React.useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase("pt-BR")
    return courses.filter((course) => {
      const matchesSearch =
        !query ||
        course.title.toLocaleLowerCase("pt-BR").includes(query) ||
        course.status.toLocaleLowerCase("pt-BR").includes(query) ||
        course.description.toLocaleLowerCase("pt-BR").includes(query)
      const matchesLevel = levelFilter === "all" || course.level === levelFilter
      return matchesSearch && matchesLevel
    })
  }, [courses, levelFilter, searchQuery])

  if (role !== "admin") {
    return (
      <div className="p-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Acesso restrito</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">Esta área é exclusiva para administradores.</CardContent>
        </Card>
      </div>
    )
  }

  return (
    <DashboardPage
      title="Gerenciar cursos"
      breadcrumbItems={breadcrumbItems}
      description="Gerencie o catálogo e abra cada curso para editar seus dados ou conteúdo."
      contentClassName="gap-8"
      action={
        <Button
          size="sm"
          onClick={() => {
            if (showCreate) {
              setShowCreate(false)
              void discardCreateDraft()
            } else {
              resetForm()
              setShowCreate(true)
            }
          }}
        >
          <Plus className="size-4" />
          {showCreate ? "Fechar" : "Novo curso"}
        </Button>
      }
      toolbar={
        <>
          <SearchField
            value={searchQuery}
            onChange={setSearchQuery}
            ariaLabel="Buscar cursos"
            placeholder="Buscar por título, status ou descrição..."
            className="relative min-w-0 flex-1 sm:max-w-md"
          />
          <NativeSelect
            aria-label="Filtrar cursos por nível"
            value={levelFilter}
            onChange={(event) => setLevelFilter(event.target.value as "all" | AdminCourseFormValue["level"])}
            className="w-full sm:w-48"
          >
            <option value="all">Todos os níveis</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </NativeSelect>
          <span className="ml-auto text-xs text-muted-foreground">{filteredCourses.length} de {courses.length} cursos</span>
        </>
      }
    >
      {!isFirebaseReady ? <DashboardNotice className="text-xs">Firebase não configurado. Conecte para visualizar cursos reais.</DashboardNotice> : null}
      {error || deleteError ? <DashboardNotice tone="danger" className="text-xs">{error || deleteError}</DashboardNotice> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard title="Catálogo" value={metrics.coursesCount} icon={Layers3} description="Cursos cadastrados" loading={loading} />
        <DashboardStatCard title="Alunos únicos" value={metrics.uniqueStudentsCount} icon={Users2} description="Pessoas vinculadas ao catálogo" loading={loading} />
        <DashboardStatCard title="Estrutura" value={metrics.modulesCount} icon={ClipboardList} description="Módulos publicados" loading={loading} />
        <DashboardStatCard title="Atividades" value={metrics.activitiesCount} icon={BookOpenCheck} description="Total interativo" loading={loading} />
      </div>

      <section className="space-y-4">
        <DashboardSectionHeader
          title="Catálogo de cursos"
          description="Abra um curso para visualizar, editar dados básicos ou gerenciar módulos, materiais e atividades."
          icon={BookOpenCheck}
        />

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-72 animate-pulse rounded-2xl border border-border bg-muted/45" />
            ))}
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/25 p-10 text-center">
            <p className="text-sm font-medium">Nenhum curso encontrado</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {searchQuery || levelFilter !== "all" ? "Ajuste a busca ou os filtros para ver outros resultados." : "Crie o primeiro curso para iniciar o catálogo."}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredCourses.map((course) => (
              <AdminCourseCard
                key={course.id}
                course={course}
                onDelete={handleDeleteCourse}
                deleting={deletingCourseId === course.id}
              />
            ))}
          </div>
        )}
      </section>

      {showCreate ? (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <DashboardSectionHeader
            title="Novo curso"
            description="Cadastre os dados básicos. A edição posterior acontece dentro da página do próprio curso."
            icon={Plus}
          />
          <AdminCourseForm
            title="Dados do curso"
            value={form}
            teachers={teachers}
            submitting={creating}
            error={createError}
            submitLabel="Criar curso"
            onChange={setForm}
            onSubmit={() => void handleSubmitCourse()}
            onReset={() => void discardCreateDraft()}
            onCancel={() => {
              setShowCreate(false)
              void discardCreateDraft()
            }}
          />
        </div>
      ) : null}
    </DashboardPage>
  )
}
