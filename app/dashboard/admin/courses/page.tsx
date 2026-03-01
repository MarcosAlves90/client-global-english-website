"use client"

import * as React from "react"
import {
  BookOpenCheck,
  ClipboardList,
  Layers3,
  Search,
  Sparkles,
  Users2,
} from "lucide-react"

import { DashboardHeader } from "@/components/dashboard-header"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { AdminCourseSummary } from "@/lib/firebase/types"
import {
  AdminCourseCard,
  COURSE_STATUS_OPTIONS,
  deleteAdminCourse,
  fetchAdminCourses,
  saveAdminCourse,
  type CourseStatus,
} from "@/modules/courses"

type CreateCourseForm = {
  title: string
  description: string
  level: "Beginner" | "Intermediate" | "Advanced"
  durationWeeks: string
  coverUrl: string
  status: CourseStatus
}

const selectClassName =
  "bg-card text-foreground border-input h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"

export default function Page() {
  const { role, isFirebaseReady, user } = useAuth()
  const [courses, setCourses] = React.useState<AdminCourseSummary[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [showCreate, setShowCreate] = React.useState(false)
  const [editingCourseId, setEditingCourseId] = React.useState<string | null>(null)
  const [creating, setCreating] = React.useState(false)
  const [createError, setCreateError] = React.useState<string | null>(null)
  const [deleteError, setDeleteError] = React.useState<string | null>(null)
  const [deletingCourseId, setDeletingCourseId] = React.useState<string | null>(
    null
  )
  const [searchQuery, setSearchQuery] = React.useState("")
  const [form, setForm] = React.useState<CreateCourseForm>({
    title: "",
    description: "",
    level: "Beginner",
    durationWeeks: "4",
    coverUrl: "",
    status: "Inscrições abertas",
  })

  const isEditing = editingCourseId !== null
  const breadcrumbItems = React.useMemo(() => [{ label: "Admin", href: "/dashboard/admin" }, { label: "Cursos" }], [])

  const resetForm = React.useCallback(() => {
    setForm({
      title: "",
      description: "",
      level: "Beginner",
      durationWeeks: "4",
      coverUrl: "",
      status: "Inscrições abertas",
    })
    setEditingCourseId(null)
    setCreateError(null)
  }, [])

  const loadCourses = React.useCallback(async (force?: boolean) => {
    try {
      setLoading(true)
      setError(null)
      const idToken = user ? await user.getIdToken() : null
      const data = await fetchAdminCourses(idToken, { force })
      setCourses(data)
    } catch {
      setError("Não foi possível carregar os cursos.")
    } finally {
      setLoading(false)
    }
  }, [user])

  React.useEffect(() => {
    if (!isFirebaseReady || role !== "admin") {
      return
    }

    void loadCourses()
  }, [isFirebaseReady, role, loadCourses])

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
      const idToken = user ? await user.getIdToken() : null
      await saveAdminCourse(idToken, {
        ...(isEditing ? { id: editingCourseId ?? undefined } : {}),
        title: form.title.trim(),
        description: form.description.trim(),
        level: form.level,
        durationWeeks,
        coverUrl: form.coverUrl.trim() || null,
        status: form.status,
      })

      resetForm()
      setShowCreate(false)
      await loadCourses()
    } catch {
      setCreateError(
        isEditing
          ? "Não foi possível salvar o curso."
          : "Não foi possível criar o curso."
      )
    } finally {
      setCreating(false)
    }
  }

  const handleEditCourse = (course: AdminCourseSummary) => {
    const status = COURSE_STATUS_OPTIONS.includes(course.status as CourseStatus)
      ? (course.status as CourseStatus)
      : "Inscrições abertas"

    setEditingCourseId(course.id)
    setCreateError(null)
    setForm({
      title: course.title,
      description: course.description,
      level: course.level,
      durationWeeks: String(course.durationWeeks || 1),
      coverUrl: course.coverUrl ?? "",
      status,
    })
    setShowCreate(true)
  }

  const handleDeleteCourse = async (course: AdminCourseSummary) => {
    const confirmed = window.confirm(
      `Tem certeza que deseja excluir o curso "${course.title}"? Esta ação removerá módulos, materiais e atividades relacionadas.`
    )
    if (!confirmed) {
      return
    }

    try {
      setDeletingCourseId(course.id)
      setDeleteError(null)
      const idToken = user ? await user.getIdToken() : null
      await deleteAdminCourse(idToken, course.id)
      if (editingCourseId === course.id) {
        resetForm()
        setShowCreate(false)
      }
      await loadCourses(true)
    } catch {
      setDeleteError("Não foi possível excluir o curso.")
    } finally {
      setDeletingCourseId(null)
    }
  }

  const filteredCourses = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return courses
    return courses.filter(
      (course) =>
        course.title.toLowerCase().includes(query) ||
        course.status.toLowerCase().includes(query)
    )
  }, [courses, searchQuery])

  const totalStudents = React.useMemo(
    () => courses.reduce((acc, course) => acc + course.studentsCount, 0),
    [courses]
  )
  const totalModules = React.useMemo(
    () => courses.reduce((acc, course) => acc + course.modulesCount, 0),
    [courses]
  )
  const totalActivities = React.useMemo(
    () => courses.reduce((acc, course) => acc + course.activitiesCount, 0),
    [courses]
  )

  if (role !== "admin") {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Acesso restrito</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Esta área é exclusiva para administradores.
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div>
      <DashboardHeader
        title="Gerenciar cursos"
        breadcrumbItems={breadcrumbItems}
        description="Gerencie catálogo, módulos e matrículas corporativas."
        action={
          <Button
            size="sm"
            onClick={() => {
              if (showCreate) {
                setShowCreate(false)
                resetForm()
                return
              }
              resetForm()
              setShowCreate(true)
            }}
          >
            {showCreate ? "Fechar" : "Novo curso"}
          </Button>
        }
      />

      <div className="flex flex-col gap-6 p-6">
        {!isFirebaseReady ? (
          <div className="rounded-2xl border border-dashed bg-accent/40 p-4 text-sm text-muted-foreground">
            Firebase não configurado. Conecte para visualizar cursos reais.
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-dashed border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : null}
        {deleteError ? (
          <div className="rounded-2xl border border-dashed border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            {deleteError}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Cursos", value: courses.length, icon: Layers3 },
            { label: "Alunos em cursos", value: totalStudents, icon: Users2 },
            { label: "Módulos", value: totalModules, icon: ClipboardList },
            { label: "Atividades", value: totalActivities, icon: BookOpenCheck },
          ].map((item) => (
            <Card key={item.label} className="transition-all hover:shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {item.label}
                </CardTitle>
                <item.icon className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">{item.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {showCreate ? (
          <Card className="border-primary/20">
            <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="size-4 text-primary" />
                  {isEditing ? "Editar curso" : "Criar novo curso"}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {isEditing
                    ? "Ajuste os dados e salve para atualizar o catálogo."
                    : "Preencha os dados principais para publicar no catálogo."}
                </p>
              </div>
              <span className="rounded-full border bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                {isEditing ? "Modo edição" : "Setup inicial"}
              </span>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="course-title">Título do curso</Label>
                <Input
                  id="course-title"
                  placeholder="Ex.: Inglês para negociações internacionais"
                  value={form.title}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, title: event.target.value }))
                  }
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="course-description">Descrição</Label>
                <textarea
                  id="course-description"
                  className="bg-card text-foreground border-input min-h-28 w-full rounded-md border p-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                  placeholder="Resumo do objetivo, público-alvo e entregáveis"
                  value={form.description}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, description: event.target.value }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  {form.description.length} caracteres
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="course-level">Nível</Label>
                <select
                  id="course-level"
                  className={selectClassName}
                  value={form.level}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      level: event.target.value as CreateCourseForm["level"],
                    }))
                  }
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="course-duration">Duração (semanas)</Label>
                <Input
                  id="course-duration"
                  type="number"
                  min={1}
                  value={form.durationWeeks}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      durationWeeks: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="course-status">Status operacional</Label>
                <select
                  id="course-status"
                  className={selectClassName}
                  value={form.status}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      status: event.target.value as CourseStatus,
                    }))
                  }
                >
                  {COURSE_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="course-cover">URL da capa (opcional)</Label>
                <Input
                  id="course-cover"
                  placeholder="https://..."
                  value={form.coverUrl}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, coverUrl: event.target.value }))
                  }
                />
              </div>

              <div className="rounded-xl border bg-muted/30 p-3 text-xs text-muted-foreground md:col-span-2">
                Dica: prefira títulos curtos e objetivos. Isso melhora conversão na
                vitrine e facilita busca interna.
              </div>

              {createError ? (
                <div className="md:col-span-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                  {createError}
                </div>
              ) : null}

              <div className="md:col-span-2 flex flex-wrap items-center gap-2">
                <Button onClick={handleSubmitCourse} disabled={creating}>
                  {creating
                    ? isEditing
                      ? "Salvando curso..."
                      : "Criando curso..."
                    : isEditing
                      ? "Salvar alterações"
                      : "Publicar curso"}
                </Button>
                <Button
                  variant="outline"
                  disabled={creating}
                  onClick={resetForm}
                >
                  {isEditing ? "Limpar edição" : "Limpar formulário"}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowCreate(false)
                    resetForm()
                  }}
                  disabled={creating}
                >
                  Fechar
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-base">Catálogo de cursos</CardTitle>
              <p className="text-sm text-muted-foreground">
                Visualize, pesquise e gerencie cursos publicados.
              </p>
            </div>
            <div className="flex w-full flex-wrap items-center gap-2 md:w-auto">
              <div className="relative min-w-60 flex-1 md:flex-initial">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Buscar por título ou status"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => void loadCourses(true)}
                disabled={loading}
              >
                Atualizar lista
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {loading ? (
                <Card className="md:col-span-2 2xl:col-span-3">
                  <CardContent className="p-6 text-sm text-muted-foreground">
                    Carregando cursos...
                  </CardContent>
                </Card>
              ) : filteredCourses.length === 0 ? (
                <Card className="md:col-span-2 2xl:col-span-3">
                  <CardContent className="p-6 text-sm text-muted-foreground">
                    {searchQuery
                      ? "Nenhum curso encontrado para essa busca."
                      : "Nenhum curso encontrado."}
                  </CardContent>
                </Card>
              ) : (
                filteredCourses.map((course) => (
                  <AdminCourseCard
                    key={course.id}
                    course={course}
                    onEdit={handleEditCourse}
                    onDelete={handleDeleteCourse}
                    deleting={deletingCourseId === course.id}
                  />
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
