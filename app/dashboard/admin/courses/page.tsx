"use client"

import * as React from "react"
import {
  BookOpenCheck,
  ClipboardList,
  Layers3,
  Search,
  Sparkles,
  Users2,
  Calendar,
  X,
  AlertCircle,
  Plus,
} from "lucide-react"

import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardStatCard } from "@/components/dashboard-stat-card"
import { DashboardSectionHeader } from "@/components/dashboard-section-header"
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
import { uploadImage } from "@/lib/cloudinary-actions"
import { toast } from "sonner"
import { Loader2, Upload } from "lucide-react"

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
  const [isUploading, setIsUploading] = React.useState(false)
  const coverInputRef = React.useRef<HTMLInputElement>(null)
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

  const handleCoverUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setIsUploading(true)
      const formData = new FormData()
      formData.append("file", file)
      const result = await uploadImage(formData, "covers")
      setForm(prev => ({ ...prev, coverUrl: result.secure_url }))
      toast.success("Capa enviada com sucesso!")
    } catch (error) {
      console.error("Upload failed:", error)
      toast.error("Falha no envio da capa.")
    } finally {
      setIsUploading(false)
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

      <div className="flex flex-col gap-8 p-6">
        {/* Error States */}
        {!isFirebaseReady && (
          <div className="rounded-xl border border-dashed bg-accent/40 p-4 text-xs text-muted-foreground">
            Firebase não configurado. Conecte para visualizar cursos reais.
          </div>
        )}
        {(error || deleteError) && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-xs text-destructive">
            {error || deleteError}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <DashboardStatCard
            title="Catálogo"
            value={courses.length}
            icon={Layers3}
            description="Cursos cadastrados"
            loading={loading}
          />
          <DashboardStatCard
            title="Alunos ativos"
            value={totalStudents}
            icon={Users2}
            description="Total em cursos"
            loading={loading}
          />
          <DashboardStatCard
            title="Estrutura"
            value={totalModules}
            icon={ClipboardList}
            description="Módulos publicados"
            loading={loading}
          />
          <DashboardStatCard
            title="Atividades"
            value={totalActivities}
            icon={BookOpenCheck}
            description="Total interativo"
            loading={loading}
          />
        </div>

        {/* List Section */}
        <div className="space-y-4">
          <DashboardSectionHeader
            title="Catálogo de cursos"
            description="Gerencie o que está visível para os alunos e acompanhe métricas de engajamento."
            icon={BookOpenCheck}
            action={
              <div className="flex items-center gap-2 max-lg:w-full">
                <div className="relative max-lg:w-full">
                  <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar cursos..."
                    className="h-9 w-full pl-9 lg:w-[300px] bg-card/40 backdrop-blur-sm border-primary/10 transition-all focus:border-primary/30"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full border-primary/10 hover:border-primary/30"
                  onClick={() => setSearchQuery("")}
                >
                  Limpar
                </Button>
              </div>
            }
          />

          <div className="rounded-xl bg-card/30 backdrop-blur-sm border border-primary/5 p-1 transition-all">
            {loading ? (
              <div className="flex h-40 items-center justify-center text-sm text-muted-foreground animate-pulse">
                Sincronizando catálogo...
              </div>
            ) : filteredCourses.length === 0 ? (
              <div className="flex h-40 items-center justify-center text-sm text-muted-foreground border border-dashed border-primary/10 rounded-lg m-2">
                {searchQuery ? "Nenhum curso corresponde à busca." : "Nenhum curso cadastrado."}
              </div>
            ) : (
              <div className="grid gap-4 p-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {filteredCourses.map((course) => (
                  <AdminCourseCard
                    key={course.id}
                    course={course}
                    onEdit={handleEditCourse}
                    onDelete={handleDeleteCourse}
                    deleting={deletingCourseId === course.id}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Form Section */}
        {showCreate && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <DashboardSectionHeader
              title={isEditing ? "Editar curso" : "Novo treinamento"}
              description={isEditing ? "Modifique título, descrição ou status operacional do curso." : "Defina os parâmetros iniciais para o seu novo treinamento na Global English."}
              icon={isEditing ? Sparkles : Plus}
            />

            <Card className="border-primary/10 bg-card/40 backdrop-blur-sm overflow-hidden border-dashed">
              <CardHeader className="border-b border-primary/5 bg-primary/1">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <div className="size-2 rounded-full bg-primary animate-pulse" />
                  Propriedades Técnicas
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2 pt-6">
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
                  <Label>Capa do curso</Label>
                  <div className="flex items-center gap-4">
                    {form.coverUrl && (
                      <div className="relative size-11 rounded-lg overflow-hidden border border-primary/10">
                        <img src={form.coverUrl} alt="Capa" className="size-full object-cover" />
                      </div>
                    )}
                    <input
                      type="file"
                      ref={coverInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleCoverUpload}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-11 flex-1 border-dashed"
                      onClick={() => coverInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      {isUploading ? <Loader2 className="size-4 animate-spin mr-2" /> : <Upload className="size-4 mr-2" />}
                      {isUploading ? "Enviando..." : form.coverUrl ? "Alterar Capa" : "Upload da Capa"}
                    </Button>
                  </div>
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

                {createError && (
                  <div className="md:col-span-2 text-sm text-destructive flex items-center gap-2">
                    <AlertCircle className="size-4" />
                    {createError}
                  </div>
                )}

                <div className="md:col-span-2 flex items-center gap-3 pt-6 border-t border-primary/5 mt-2">
                  <Button
                    onClick={handleSubmitCourse}
                    disabled={creating}
                    className="rounded-full px-10 shadow-lg shadow-primary/20 transition-all active:scale-95"
                  >
                    {creating ? "Sincronizando..." : isEditing ? "Salvar alterações" : "Publicar curso"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={resetForm}
                    className="rounded-full px-6"
                    disabled={creating}
                  >
                    Limpar
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => { setShowCreate(false); resetForm(); }}
                    className="rounded-full"
                    disabled={creating}
                  >
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
