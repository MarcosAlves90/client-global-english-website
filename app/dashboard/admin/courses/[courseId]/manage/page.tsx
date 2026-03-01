"use client"

import * as React from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import dynamic from "next/dynamic"
import {
  ArrowLeft,
  BookOpenCheck,
  Calendar,
  ClipboardList,
  FileAudio,
  FileText,
  Layers3,
  Link as LinkIcon,
  Sparkles,
  Users2,
  Video,
  X,
} from "lucide-react"

import { DashboardHeader } from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/hooks/use-auth"
import type {
  Activity,
  AdminCourseSummary,
  AdminUserSummary,
  Material,
  Track,
} from "@/lib/firebase/types"
import { fetchAdminCourses } from "@/modules/courses"
import {
  createAdminCourseTrack,
  deleteAdminCourseTrack,
  fetchAdminCourseTracks,
  updateAdminCourseTrack,
} from "@/modules/tracks"
import {
  createAdminMaterial,
  deleteAdminMaterial,
  fetchAdminCourseMaterials,
} from "@/modules/materials"
import {
  createAdminActivity,
  deleteAdminActivity,
  fetchAdminCourseActivities,
} from "@/modules/activities"
import { fetchAdminUsersPage } from "@/modules/users"

const USERS_PAGE_SIZE = 50

type TrackForm = {
  title: string
  description: string
  order: string
  userIds: string[]
}

type MaterialForm = {
  trackId: string
  title: string
  visibility: "module" | "users" | "private"
  userIds: string[]
  scheduleMode: "now" | "scheduled"
  releaseAt: string
  markdown: string
  attachments: { name: string; url: string; type: "pdf" | "video" | "link" | "audio" }[]
}

type ActivityForm = {
  trackId: string
  title: string
  type: "lesson" | "quiz" | "assignment" | "project"
  estimatedMinutes: string
  order: string
  visibility: "module" | "users" | "private"
  userIds: string[]
  scheduleMode: "now" | "scheduled"
  releaseAt: string
  attachments: { name: string; url: string; type: "pdf" | "video" | "link" | "audio" }[]
  questions: {
    id: string
    type: "essay" | "single_choice" | "multiple_choice" | "true_false" | "short_answer"
    prompt: string
    options: string[]
    correctAnswers: string[]
    points: string
    required: boolean
  }[]
}

const MATERIAL_TYPE_LABELS: Record<"pdf" | "video" | "link" | "audio", string> = {
  pdf: "PDF",
  video: "Vídeo",
  link: "Link",
  audio: "Áudio",
}

const MATERIAL_TYPE_ICONS: Record<
  "pdf" | "video" | "link" | "audio",
  React.ComponentType<{ className?: string }>
> = {
  pdf: FileText,
  video: Video,
  link: LinkIcon,
  audio: FileAudio,
}

const MarkdownEditor = dynamic(() => import("@uiw/react-md-editor"), {
  ssr: false,
})

const ACTIVITY_TYPE_LABELS: Record<ActivityForm["type"], string> = {
  lesson: "Aula",
  quiz: "Quiz",
  assignment: "Atividade",
  project: "Projeto",
}

const ACTIVITY_TYPE_ICONS: Record<
  ActivityForm["type"],
  React.ComponentType<{ className?: string }>
> = {
  lesson: BookOpenCheck,
  quiz: ClipboardList,
  assignment: FileText,
  project: Layers3,
}

export default function Page() {
  const { role, isFirebaseReady, user } = useAuth()
  const params = useParams<{ courseId?: string }>()
  const courseId = Array.isArray(params?.courseId)
    ? params.courseId[0]
    : params?.courseId

  const [course, setCourse] = React.useState<AdminCourseSummary | null>(null)
  const [tracks, setTracks] = React.useState<Track[]>([])
  const [loadingCourse, setLoadingCourse] = React.useState(false)
  const [loadingTracks, setLoadingTracks] = React.useState(false)
  const [loadingUsers, setLoadingUsers] = React.useState(false)
  const [loadingMaterials, setLoadingMaterials] = React.useState(false)
  const [loadingActivities, setLoadingActivities] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [trackError, setTrackError] = React.useState<string | null>(null)
  const [userError, setUserError] = React.useState<string | null>(null)
  const [materialError, setMaterialError] = React.useState<string | null>(null)
  const [activityError, setActivityError] = React.useState<string | null>(null)
  const [creating, setCreating] = React.useState(false)
  const [creatingMaterial, setCreatingMaterial] = React.useState(false)
  const [creatingActivity, setCreatingActivity] = React.useState(false)
  const [deletingTrackId, setDeletingTrackId] = React.useState<string | null>(
    null
  )
  const [deletingMaterialId, setDeletingMaterialId] = React.useState<
    string | null
  >(null)
  const [deletingActivityId, setDeletingActivityId] = React.useState<
    string | null
  >(null)
  const [editingTrackId, setEditingTrackId] = React.useState<string | null>(
    null
  )
  const [form, setForm] = React.useState<TrackForm>({
    title: "",
    description: "",
    order: "",
    userIds: [],
  })
  const [availableUsers, setAvailableUsers] = React.useState<AdminUserSummary[]>(
    []
  )
  const [userSearch, setUserSearch] = React.useState("")
  const [materials, setMaterials] = React.useState<Material[]>([])
  const [materialUserSearch, setMaterialUserSearch] = React.useState("")
  const [materialForm, setMaterialForm] = React.useState<MaterialForm>({
    trackId: "",
    title: "",
    visibility: "module",
    userIds: [],
    scheduleMode: "now",
    releaseAt: "",
    markdown: "",
    attachments: [],
  })
  const [activities, setActivities] = React.useState<Activity[]>([])
  const [activityUserSearch, setActivityUserSearch] = React.useState("")
  const [activityForm, setActivityForm] = React.useState<ActivityForm>({
    trackId: "",
    title: "",
    type: "lesson",
    estimatedMinutes: "",
    order: "",
    visibility: "module",
    userIds: [],
    scheduleMode: "now",
    releaseAt: "",
    attachments: [],
    questions: [],
  })
  const [activeSection, setActiveSection] = React.useState<
    "overview" | "modules" | "materials" | "activities"
  >("overview")
  const breadcrumbItems = React.useMemo(
    () => [
      { label: "Admin", href: "/dashboard/admin" },
      { label: "Cursos", href: "/dashboard/admin/courses" },
      {
        label: course?.title ?? "Curso",
        href: `/dashboard/admin/courses/${courseId}`,
      },
      { label: "Gerenciar" },
    ],
    [course?.title, courseId]
  )
  const sectionTabs = React.useMemo(
    () => [
      { id: "overview", label: "Visão geral" },
      { id: "modules", label: "Módulos" },
      { id: "materials", label: "Materiais" },
      { id: "activities", label: "Atividades" },
    ],
    []
  )

  const isEditing = editingTrackId !== null

  const loadCourse = React.useCallback(async () => {
    if (!courseId) {
      setError("Curso inválido.")
      return
    }

    try {
      setLoadingCourse(true)
      setError(null)
      const idToken = user ? await user.getIdToken() : null
      const data = await fetchAdminCourses(idToken)
      const match = data.find((item) => item.id === courseId) ?? null
      setCourse(match)
      if (!match) {
        setError("Curso não encontrado.")
      }
    } catch {
      setError("Não foi possível carregar o curso.")
    } finally {
      setLoadingCourse(false)
    }
  }, [courseId, user])

  const loadTracks = React.useCallback(async (force?: boolean) => {
    if (!courseId) return
    try {
      setLoadingTracks(true)
      setTrackError(null)
      const idToken = user ? await user.getIdToken() : null
      const data = await fetchAdminCourseTracks(idToken, courseId, { force })
      setTracks(data)
    } catch {
      setTrackError("Não foi possível carregar os módulos.")
    } finally {
      setLoadingTracks(false)
    }
  }, [courseId, user])

  const loadUsers = React.useCallback(async () => {
    try {
      setLoadingUsers(true)
      setUserError(null)
      const idToken = user ? await user.getIdToken() : null
      const allUsers: AdminUserSummary[] = []
      let cursor: string | null = null

      do {
        const data = await fetchAdminUsersPage({
          idToken,
          pageSize: USERS_PAGE_SIZE,
          cursor,
        })
        allUsers.push(...data.items)
        cursor = data.nextCursor
      } while (cursor)

      allUsers.sort((a, b) => a.name.localeCompare(b.name))
      setAvailableUsers(allUsers)
    } catch {
      setUserError("Não foi possível carregar os usuários.")
    } finally {
      setLoadingUsers(false)
    }
  }, [user])

  const loadMaterials = React.useCallback(async (force?: boolean) => {
    if (!courseId) return
    try {
      setLoadingMaterials(true)
      setMaterialError(null)
      const idToken = user ? await user.getIdToken() : null
      const data = await fetchAdminCourseMaterials(idToken, courseId, { force })
      setMaterials(data)
    } catch {
      setMaterialError("Não foi possível carregar os materiais.")
    } finally {
      setLoadingMaterials(false)
    }
  }, [courseId, user])

  const loadActivities = React.useCallback(async (force?: boolean) => {
    if (!courseId) return
    try {
      setLoadingActivities(true)
      setActivityError(null)
      const idToken = user ? await user.getIdToken() : null
      const data = await fetchAdminCourseActivities(idToken, courseId, { force })
      setActivities(data)
    } catch {
      setActivityError("Não foi possível carregar as atividades.")
    } finally {
      setLoadingActivities(false)
    }
  }, [courseId, user])

  React.useEffect(() => {
    if (!isFirebaseReady || role !== "admin") {
      return
    }

    void loadCourse()
    void loadTracks()
    void loadUsers()
    void loadMaterials()
    void loadActivities()
  }, [
    isFirebaseReady,
    role,
    loadCourse,
    loadTracks,
    loadUsers,
    loadMaterials,
    loadActivities,
  ])

  const resetForm = React.useCallback(() => {
    setForm({ title: "", description: "", order: "", userIds: [] })
    setEditingTrackId(null)
    setTrackError(null)
  }, [])

  const resetMaterialForm = React.useCallback(() => {
    setMaterialForm({
      trackId: "",
      title: "",
      visibility: "module",
      userIds: [],
      scheduleMode: "now",
      releaseAt: "",
      markdown: "",
      attachments: [],
    })
    setMaterialUserSearch("")
    setMaterialError(null)
  }, [])

  const resetActivityForm = React.useCallback(() => {
    setActivityForm({
      trackId: "",
      title: "",
      type: "lesson",
      estimatedMinutes: "",
      order: "",
      visibility: "module",
      userIds: [],
      scheduleMode: "now",
      releaseAt: "",
      attachments: [],
      questions: [],
    })
    setActivityUserSearch("")
    setActivityError(null)
  }, [])

  const handleCreateOrUpdateTrack = async () => {
    if (!courseId) {
      setTrackError("Curso inválido.")
      return
    }

    if (!form.title.trim() || !form.description.trim()) {
      setTrackError("Título e descrição são obrigatórios.")
      return
    }

    const orderValue = form.order.trim()
    let resolvedOrder: number | undefined
    if (orderValue) {
      const orderNumber = Number(orderValue)
      if (!Number.isFinite(orderNumber) || orderNumber <= 0) {
        setTrackError("A ordem deve ser um número positivo.")
        return
      }
      resolvedOrder = Math.floor(orderNumber)
    }

    try {
      setCreating(true)
      setTrackError(null)
      const idToken = user ? await user.getIdToken() : null
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        order: resolvedOrder,
        userIds: form.userIds,
      }

      if (isEditing) {
        await updateAdminCourseTrack(idToken, {
          id: editingTrackId ?? "",
          ...payload,
        })
      } else {
        await createAdminCourseTrack(idToken, {
          courseId,
          ...payload,
        })
      }
      resetForm()
      await loadTracks()
    } catch (err) {
      if (err instanceof Error && err.message === "USER_CONFLICT") {
        setTrackError(
          "Alguns usuários já estão em outro módulo deste curso. Remova-os antes de salvar."
        )
      } else {
        setTrackError(
          isEditing
            ? "Não foi possível salvar o módulo."
            : "Não foi possível criar o módulo."
        )
      }
    } finally {
      setCreating(false)
    }
  }

  const handleCreateMaterial = async () => {
    if (!courseId) {
      setMaterialError("Curso inválido.")
      return
    }

    if (!materialForm.trackId) {
      setMaterialError("Selecione um módulo.")
      return
    }

    if (!materialForm.title.trim()) {
      setMaterialError("Título é obrigatório.")
      return
    }

    const hasContent =
      Boolean(materialForm.markdown.trim()) ||
      materialForm.attachments.some((item) => item.url.trim())
    if (!hasContent) {
      setMaterialError("Adicione um texto markdown ou anexos.")
      return
    }

    if (materialForm.visibility === "users" && materialForm.userIds.length === 0) {
      setMaterialError("Selecione ao menos um usuário.")
      return
    }

    if (
      materialForm.visibility !== "private" &&
      materialForm.scheduleMode === "scheduled" &&
      !materialForm.releaseAt
    ) {
      setMaterialError("Informe data e hora para o agendamento.")
      return
    }

    try {
      setCreatingMaterial(true)
      setMaterialError(null)
      const idToken = user ? await user.getIdToken() : null
      const releaseAt =
        materialForm.visibility === "private" || materialForm.scheduleMode === "now"
          ? null
          : new Date(materialForm.releaseAt).toISOString()

      await createAdminMaterial(idToken, {
        courseId,
        trackId: materialForm.trackId,
        title: materialForm.title.trim(),
        visibility: materialForm.visibility,
        userIds:
          materialForm.visibility === "users" ? materialForm.userIds : undefined,
        releaseAt,
        markdown: materialForm.markdown.trim(),
        attachments: materialForm.attachments.filter((item) => item.url.trim()),
      })

      resetMaterialForm()
      await loadMaterials()
    } catch {
      setMaterialError("Não foi possível criar o material.")
    } finally {
      setCreatingMaterial(false)
    }
  }

  const handleCreateActivity = async () => {
    if (!courseId) {
      setActivityError("Curso inválido.")
      return
    }

    if (!activityForm.trackId) {
      setActivityError("Selecione um módulo.")
      return
    }

    if (!activityForm.title.trim()) {
      setActivityError("Título é obrigatório.")
      return
    }

    const estimatedMinutes = Number(activityForm.estimatedMinutes)
    if (!Number.isFinite(estimatedMinutes) || estimatedMinutes <= 0) {
      setActivityError("Informe a duração estimada em minutos.")
      return
    }

    const orderValue = activityForm.order.trim()
    let resolvedOrder: number | undefined
    if (orderValue) {
      const orderNumber = Number(orderValue)
      if (!Number.isFinite(orderNumber) || orderNumber <= 0) {
        setActivityError("A ordem deve ser um número positivo.")
        return
      }
      resolvedOrder = Math.floor(orderNumber)
    }

    if (activityForm.visibility === "users" && activityForm.userIds.length === 0) {
      setActivityError("Selecione ao menos um usuário.")
      return
    }

    if (
      activityForm.visibility !== "private" &&
      activityForm.scheduleMode === "scheduled" &&
      !activityForm.releaseAt
    ) {
      setActivityError("Informe data e hora para o agendamento.")
      return
    }

    try {
      setCreatingActivity(true)
      setActivityError(null)
      const idToken = user ? await user.getIdToken() : null
      const releaseAt =
        activityForm.visibility === "private" || activityForm.scheduleMode === "now"
          ? null
          : new Date(activityForm.releaseAt).toISOString()

      await createAdminActivity(idToken, {
        courseId,
        trackId: activityForm.trackId,
        title: activityForm.title.trim(),
        type: activityForm.type,
        order: resolvedOrder,
        estimatedMinutes,
        visibility: activityForm.visibility,
        userIds:
          activityForm.visibility === "users" ? activityForm.userIds : undefined,
        releaseAt,
        attachments: activityForm.attachments.filter((item) => item.url.trim()),
        questions: activityForm.questions
          .filter((item) => item.prompt.trim())
          .map((item) => ({
            id: item.id,
            type: item.type,
            prompt: item.prompt.trim(),
            options: item.options.filter((opt) => opt.trim()),
            correctAnswers: item.correctAnswers.filter((opt) => opt.trim()),
            points: Number(item.points) || 0,
            required: item.required,
          })),
      })

      resetActivityForm()
      await loadActivities()
    } catch {
      setActivityError("Não foi possível criar a atividade.")
    } finally {
      setCreatingActivity(false)
    }
  }

  const handleDeleteTrack = async (track: Track) => {
    const confirmed = window.confirm(
      `Deseja excluir o módulo "${track.title}"? Materiais e atividades vinculados serão removidos.`
    )
    if (!confirmed) {
      return
    }

    try {
      setDeletingTrackId(track.id)
      setTrackError(null)
      const idToken = user ? await user.getIdToken() : null
      await deleteAdminCourseTrack(idToken, track.id)

      if (editingTrackId === track.id) {
        resetForm()
      }

      setMaterialForm((prev) => ({
        ...prev,
        trackId: prev.trackId === track.id ? "" : prev.trackId,
      }))
      setActivityForm((prev) => ({
        ...prev,
        trackId: prev.trackId === track.id ? "" : prev.trackId,
      }))

      await Promise.all([
        loadTracks(true),
        loadMaterials(true),
        loadActivities(true),
      ])
    } catch {
      setTrackError("Não foi possível excluir o módulo.")
    } finally {
      setDeletingTrackId(null)
    }
  }

  const handleDeleteMaterial = async (material: Material) => {
    const confirmed = window.confirm(
      `Deseja excluir o material "${material.title}"?`
    )
    if (!confirmed) {
      return
    }

    try {
      setDeletingMaterialId(material.id)
      setMaterialError(null)
      const idToken = user ? await user.getIdToken() : null
      await deleteAdminMaterial(idToken, material.id)
      await loadMaterials(true)
    } catch {
      setMaterialError("Não foi possível excluir o material.")
    } finally {
      setDeletingMaterialId(null)
    }
  }

  const handleDeleteActivity = async (activity: Activity) => {
    const confirmed = window.confirm(
      `Deseja excluir a atividade "${activity.title}"?`
    )
    if (!confirmed) {
      return
    }

    try {
      setDeletingActivityId(activity.id)
      setActivityError(null)
      const idToken = user ? await user.getIdToken() : null
      await deleteAdminActivity(idToken, activity.id)
      await loadActivities(true)
    } catch {
      setActivityError("Não foi possível excluir a atividade.")
    } finally {
      setDeletingActivityId(null)
    }
  }

  const toggleUserSelection = (uid: string) => {
    setForm((prev) => {
      const exists = prev.userIds.includes(uid)
      setTrackError(null)
      if (!exists) {
        const conflict = tracks.find(
          (track) =>
            track.id !== editingTrackId &&
            (track.userIds ?? []).includes(uid)
        )
        if (conflict) {
          setTrackError(
            `O usuário já está no módulo "${conflict.title}". Remova-o de lá antes de adicionar aqui.`
          )
          return prev
        }
      }
      const nextIds = exists
        ? prev.userIds.filter((id) => id !== uid)
        : [...prev.userIds, uid]
      return { ...prev, userIds: nextIds }
    })
  }

  const toggleMaterialUserSelection = (uid: string) => {
    setMaterialForm((prev) => {
      const exists = prev.userIds.includes(uid)
      const nextIds = exists
        ? prev.userIds.filter((id) => id !== uid)
        : [...prev.userIds, uid]
      return { ...prev, userIds: nextIds }
    })
  }

  const toggleActivityUserSelection = (uid: string) => {
    setActivityForm((prev) => {
      const exists = prev.userIds.includes(uid)
      const nextIds = exists
        ? prev.userIds.filter((id) => id !== uid)
        : [...prev.userIds, uid]
      return { ...prev, userIds: nextIds }
    })
  }

  const selectedUsers = React.useMemo(() => {
    if (!form.userIds.length) {
      return []
    }
    const selected = new Set(form.userIds)
    return availableUsers.filter((user) => selected.has(user.uid))
  }, [availableUsers, form.userIds])

  const selectedMaterialUsers = React.useMemo(() => {
    if (!materialForm.userIds.length) {
      return []
    }
    const selected = new Set(materialForm.userIds)
    return availableUsers.filter((user) => selected.has(user.uid))
  }, [availableUsers, materialForm.userIds])

  const selectedActivityUsers = React.useMemo(() => {
    if (!activityForm.userIds.length) {
      return []
    }
    const selected = new Set(activityForm.userIds)
    return availableUsers.filter((user) => selected.has(user.uid))
  }, [availableUsers, activityForm.userIds])

  const filteredUsers = React.useMemo(() => {
    const query = userSearch.trim().toLowerCase()
    if (!query) {
      return availableUsers
    }
    return availableUsers.filter(
      (user) =>
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
    )
  }, [availableUsers, userSearch])

  const filteredMaterialUsers = React.useMemo(() => {
    const query = materialUserSearch.trim().toLowerCase()
    if (!query) {
      return availableUsers
    }
    return availableUsers.filter(
      (user) =>
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
    )
  }, [availableUsers, materialUserSearch])

  const filteredActivityUsers = React.useMemo(() => {
    const query = activityUserSearch.trim().toLowerCase()
    if (!query) {
      return availableUsers
    }
    return availableUsers.filter(
      (user) =>
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
    )
  }, [availableUsers, activityUserSearch])

  const suggestedUsers = React.useMemo(() => {
    const selected = new Set(form.userIds)
    return filteredUsers.filter((item) => !selected.has(item.uid)).slice(0, 6)
  }, [filteredUsers, form.userIds])

  const suggestedMaterialUsers = React.useMemo(() => {
    const selected = new Set(materialForm.userIds)
    return filteredMaterialUsers
      .filter((item) => !selected.has(item.uid))
      .slice(0, 6)
  }, [filteredMaterialUsers, materialForm.userIds])

  const suggestedActivityUsers = React.useMemo(() => {
    const selected = new Set(activityForm.userIds)
    return filteredActivityUsers
      .filter((item) => !selected.has(item.uid))
      .slice(0, 6)
  }, [filteredActivityUsers, activityForm.userIds])

  const stats = React.useMemo(
    () => ({
      modules: tracks.length,
      materials: materials.length,
      activities: activities.length,
      users: availableUsers.length,
    }),
    [tracks.length, materials.length, activities.length, availableUsers.length]
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
        title="Gerenciamento do curso"
        breadcrumbItems={breadcrumbItems}
        description="Estruture módulos, defina participantes e acompanhe o progresso do treinamento."
        action={
          <Button asChild size="sm" variant="outline">
            <Link href={`/dashboard/admin/courses/${courseId}`}>
              <ArrowLeft className="size-4" />
              Voltar para o curso
            </Link>
          </Button>
        }
      />

      <div className="flex flex-col gap-6 p-6">
        {!isFirebaseReady ? (
          <div className="rounded-2xl border border-dashed bg-accent/40 p-4 text-sm text-muted-foreground">
            Firebase não configurado. Conecte para gerenciar cursos reais.
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-dashed border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2 rounded-2xl border bg-muted/40 p-2">
          {sectionTabs.map((item) => {
            const isActive = activeSection === item.id
            return (
              <button
                key={item.id}
                type="button"
                className={`rounded-full px-4 py-2 text-sm transition ${isActive
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                  }`}
                onClick={() =>
                  setActiveSection(item.id as typeof activeSection)
                }
              >
                {item.label}
              </button>
            )
          })}
        </div>

        {activeSection === "overview" ? (
          <div className="grid gap-4 lg:grid-cols-[2fr,1.2fr]">
            <Card className="border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">Detalhes do curso</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Informações gerais e status do treinamento.
                  </p>
                </div>
                <span className="inline-flex items-center rounded-full border bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                  {course?.status ?? "Carregando"}
                </span>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Curso
                  </p>
                  <p className="text-lg font-semibold text-foreground">
                    {loadingCourse ? "Carregando..." : course?.title ?? "-"}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {course?.description ||
                    (loadingCourse ? "Carregando detalhes..." : "Sem descrição.")}
                </p>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span className="rounded-full border px-2 py-1">
                    Nível: {course?.level ?? "-"}
                  </span>
                  <span className="rounded-full border px-2 py-1">
                    Duração: {course?.durationWeeks ?? "-"} semanas
                  </span>
                  <span className="rounded-full border px-2 py-1">
                    Módulos: {stats.modules}
                  </span>
                  <span className="rounded-full border px-2 py-1">
                    Usuários disponíveis: {stats.users}
                  </span>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-3">
              {[
                { label: "Módulos ativos", value: stats.modules, icon: Layers3 },
                { label: "Materiais", value: stats.materials, icon: FileText },
                { label: "Atividades", value: stats.activities, icon: ClipboardList },
                { label: "Usuários", value: stats.users, icon: Users2 },
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
          </div>
        ) : null}

        {activeSection === "modules" ? (
          <div className="grid gap-4 lg:grid-cols-[1.2fr,2fr]">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="size-4 text-primary" />
                  {isEditing ? "Editar módulo" : "Criar módulo"}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {isEditing
                    ? "Atualize o conteúdo e os participantes do módulo."
                    : "Defina título, resumo, ordem e os usuários do módulo."}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="track-title">Título do módulo</Label>
                  <Input
                    id="track-title"
                    placeholder="Ex.: Comunicação estratégica"
                    value={form.title}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, title: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="track-description">Descrição</Label>
                  <textarea
                    id="track-description"
                    className="bg-card text-foreground border-input min-h-24 w-full rounded-md border p-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                    placeholder="Objetivo, conteúdo e resultados esperados."
                    value={form.description}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        description: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="track-order">Ordem (opcional)</Label>
                  <Input
                    id="track-order"
                    type="number"
                    min={1}
                    placeholder="Ex.: 1"
                    value={form.order}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, order: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="track-user-search">Usuários no módulo</Label>
                    <span className="text-xs text-muted-foreground">
                      {form.userIds.length} selecionado(s)
                    </span>
                  </div>
                  <Input
                    id="track-user-search"
                    placeholder="Digite para buscar por nome ou email"
                    value={userSearch}
                    onChange={(event) => setUserSearch(event.target.value)}
                  />
                  <div className="rounded-lg border border-dashed p-3">
                    {loadingUsers ? (
                      <p className="text-sm text-muted-foreground">
                        Carregando usuários...
                      </p>
                    ) : userError ? (
                      <p className="text-sm text-destructive">{userError}</p>
                    ) : (
                      <>
                        <div className="flex flex-wrap gap-2">
                          {selectedUsers.length === 0 ? (
                            <span className="text-sm text-muted-foreground">
                              Nenhum usuário selecionado.
                            </span>
                          ) : (
                            selectedUsers.map((selected) => (
                              <span
                                key={selected.uid}
                                className="inline-flex items-center gap-2 rounded-full border bg-muted px-3 py-1 text-xs"
                              >
                                {selected.name}
                                <button
                                  type="button"
                                  className="text-muted-foreground transition hover:text-foreground"
                                  onClick={() => toggleUserSelection(selected.uid)}
                                >
                                  <X className="size-3" />
                                </button>
                              </span>
                            ))
                          )}
                        </div>
                        <div className="mt-3">
                          {userSearch.trim().length === 0 ? (
                            <p className="text-xs text-muted-foreground">
                              Comece digitando para sugerir usuários.
                            </p>
                          ) : suggestedUsers.length === 0 ? (
                            <p className="text-xs text-muted-foreground">
                              Nenhum usuário corresponde à busca.
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {suggestedUsers.map((user) => (
                                <button
                                  key={user.uid}
                                  type="button"
                                  className="flex w-full items-center justify-between gap-3 rounded-md border border-transparent px-3 py-2 text-left text-sm transition hover:border-primary/20 hover:bg-muted/40"
                                  onClick={() => toggleUserSelection(user.uid)}
                                >
                                  <div>
                                    <p className="font-medium text-foreground">
                                      {user.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {user.email}
                                    </p>
                                  </div>
                                  <span className="text-xs text-muted-foreground">
                                    Adicionar
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {trackError ? (
                  <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                    {trackError}
                  </div>
                ) : null}

                <div className="flex flex-wrap items-center gap-2">
                  <Button onClick={handleCreateOrUpdateTrack} disabled={creating}>
                    {creating
                      ? isEditing
                        ? "Salvando módulo..."
                        : "Criando módulo..."
                      : isEditing
                        ? "Salvar alterações"
                        : "Salvar módulo"}
                  </Button>
                  <Button variant="outline" disabled={creating} onClick={resetForm}>
                    {isEditing ? "Cancelar edição" : "Limpar"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">Módulos cadastrados</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Acompanhe a sequência e revise o conteúdo de cada módulo.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void loadTracks(true)}
                  disabled={loadingTracks}
                >
                  Atualizar lista
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2">
                  {loadingTracks ? (
                    <Card className="md:col-span-2">
                      <CardContent className="p-6 text-sm text-muted-foreground">
                        Carregando módulos...
                      </CardContent>
                    </Card>
                  ) : tracks.length === 0 ? (
                    <Card className="md:col-span-2">
                      <CardContent className="p-6 text-sm text-muted-foreground">
                        Nenhum módulo criado. Comece cadastrando o primeiro.
                      </CardContent>
                    </Card>
                  ) : (
                    tracks.map((track) => {
                      const assignedCount = track.userIds?.length ?? 0
                      return (
                        <Card key={track.id} className="border-muted-foreground/20">
                          <CardHeader className="flex flex-row items-start justify-between gap-2">
                            <div>
                              <CardTitle className="text-base">
                                {track.title}
                              </CardTitle>
                              <p className="text-xs text-muted-foreground">
                                Ordem {track.order}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <span className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                <ClipboardList className="size-3" />
                                Módulo
                              </span>
                              <Button
                                size="xs"
                                variant="outline"
                                onClick={() => {
                                  setEditingTrackId(track.id)
                                  setTrackError(null)
                                  setForm({
                                    title: track.title,
                                    description: track.description,
                                    order: track.order ? String(track.order) : "",
                                    userIds: track.userIds ?? [],
                                  })
                                }}
                              >
                                Editar
                              </Button>
                              <Button
                                size="xs"
                                variant="destructive"
                                disabled={deletingTrackId === track.id}
                                onClick={() => void handleDeleteTrack(track)}
                              >
                                {deletingTrackId === track.id
                                  ? "Excluindo..."
                                  : "Excluir"}
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3 text-sm text-muted-foreground">
                            <p>
                              {track.description || "Sem descrição cadastrada."}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Users2 className="size-4" />
                              <span>
                                {assignedCount === 0
                                  ? "Sem usuários atribuídos"
                                  : `${assignedCount} usuário(s) no módulo`}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {activeSection === "materials" ? (
          <Card>
            <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="text-base">Materiais do módulo</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Crie materiais e controle liberação por módulo ou por usuário.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => void loadMaterials(true)}
                disabled={loadingMaterials}
              >
                Atualizar lista
              </Button>
            </CardHeader>
            <CardContent className="grid gap-6 lg:grid-cols-[1.2fr,1fr]">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="material-track">Módulo</Label>
                  <select
                    id="material-track"
                    className="bg-card text-foreground border-input h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                    value={materialForm.trackId}
                    onChange={(event) =>
                      setMaterialForm((prev) => ({
                        ...prev,
                        trackId: event.target.value,
                      }))
                    }
                  >
                    <option value="">Selecione um módulo</option>
                    {tracks.map((track) => (
                      <option key={track.id} value={track.id}>
                        {track.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="material-title">Título</Label>
                  <Input
                    id="material-title"
                    placeholder="Ex.: Checklist de apresentações"
                    value={materialForm.title}
                    onChange={(event) =>
                      setMaterialForm((prev) => ({
                        ...prev,
                        title: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Anexos</Label>
                  <div className="space-y-3">
                    {materialForm.attachments.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Nenhum anexo adicionado. Adicione links de arquivos, vídeos ou links externos.
                      </p>
                    ) : (
                      materialForm.attachments.map((attachment, index) => (
                        <div
                          key={`${attachment.url}-${index}`}
                          className="grid gap-2 rounded-lg border p-3 md:grid-cols-[160px,1fr,1.2fr,auto]"
                        >
                          <select
                            className="bg-card text-foreground border-input h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                            value={attachment.type}
                            onChange={(event) =>
                              setMaterialForm((prev) => {
                                const next = [...prev.attachments]
                                next[index] = {
                                  ...next[index],
                                  type: event.target.value as MaterialForm["attachments"][number]["type"],
                                }
                                return { ...prev, attachments: next }
                              })
                            }
                          >
                            {Object.entries(MATERIAL_TYPE_LABELS).map(([key, label]) => (
                              <option key={key} value={key}>
                                {label}
                              </option>
                            ))}
                          </select>
                          <Input
                            placeholder="Nome do anexo"
                            value={attachment.name}
                            onChange={(event) =>
                              setMaterialForm((prev) => {
                                const next = [...prev.attachments]
                                next[index] = {
                                  ...next[index],
                                  name: event.target.value,
                                }
                                return { ...prev, attachments: next }
                              })
                            }
                          />
                          <Input
                            placeholder="https://arquivo..."
                            value={attachment.url}
                            onChange={(event) =>
                              setMaterialForm((prev) => {
                                const next = [...prev.attachments]
                                next[index] = {
                                  ...next[index],
                                  url: event.target.value,
                                }
                                return { ...prev, attachments: next }
                              })
                            }
                          />
                          <Button
                            variant="outline"
                            onClick={() =>
                              setMaterialForm((prev) => ({
                                ...prev,
                                attachments: prev.attachments.filter(
                                  (_, itemIndex) => itemIndex !== index
                                ),
                              }))
                            }
                          >
                            Remover
                          </Button>
                        </div>
                      ))
                    )}
                    <Button
                      variant="outline"
                      onClick={() =>
                        setMaterialForm((prev) => ({
                          ...prev,
                          attachments: [
                            ...prev.attachments,
                            { name: "", url: "", type: "pdf" },
                          ],
                        }))
                      }
                    >
                      Adicionar anexo
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Texto (Markdown)</Label>
                  <div className="rounded-md border bg-card p-2">
                    <MarkdownEditor
                      value={materialForm.markdown}
                      onChange={(value) =>
                        setMaterialForm((prev) => ({
                          ...prev,
                          markdown: value ?? "",
                        }))
                      }
                      height={240}
                      preview="live"
                      visibleDragbar={false}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Suporta títulos, listas, links, tabelas e blocos de código.
                  </p>
                </div>


                <div className="space-y-2">
                  <Label>Disponibilidade</Label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      {
                        value: "module",
                        label: "Módulo inteiro",
                        description: "Disponível para todos do módulo",
                      },
                      {
                        value: "users",
                        label: "Usuários específicos",
                        description: "Selecionar usuários",
                      },
                      {
                        value: "private",
                        label: "Privado",
                        description: "Rascunho interno",
                      },
                    ].map((option) => {
                      const isActive = materialForm.visibility === option.value
                      return (
                        <button
                          key={option.value}
                          type="button"
                          className={`flex-1 rounded-lg border px-3 py-2 text-left text-sm transition ${isActive
                              ? "border-primary/40 bg-primary/10 text-foreground"
                              : "border-muted-foreground/20 text-muted-foreground hover:border-primary/30"
                            }`}
                          onClick={() => {
                            setMaterialForm((prev) => ({
                              ...prev,
                              visibility: option.value as MaterialForm["visibility"],
                              userIds: option.value === "users" ? prev.userIds : [],
                              scheduleMode:
                                option.value === "private"
                                  ? "now"
                                  : prev.scheduleMode,
                              releaseAt:
                                option.value === "private" ? "" : prev.releaseAt,
                            }))
                          }}
                        >
                          <p className="font-medium">{option.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {option.description}
                          </p>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {materialForm.visibility === "users" ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="material-user-search">
                        Usuários liberados
                      </Label>
                      <span className="text-xs text-muted-foreground">
                        {materialForm.userIds.length} selecionado(s)
                      </span>
                    </div>
                    <Input
                      id="material-user-search"
                      placeholder="Buscar por nome ou email"
                      value={materialUserSearch}
                      onChange={(event) =>
                        setMaterialUserSearch(event.target.value)
                      }
                    />
                    <div className="rounded-lg border border-dashed p-3">
                      {loadingUsers ? (
                        <p className="text-sm text-muted-foreground">
                          Carregando usuários...
                        </p>
                      ) : userError ? (
                        <p className="text-sm text-destructive">{userError}</p>
                      ) : (
                        <>
                          <div className="flex flex-wrap gap-2">
                            {selectedMaterialUsers.length === 0 ? (
                              <span className="text-sm text-muted-foreground">
                                Nenhum usuário selecionado.
                              </span>
                            ) : (
                              selectedMaterialUsers.map((selected) => (
                                <span
                                  key={selected.uid}
                                  className="inline-flex items-center gap-2 rounded-full border bg-muted px-3 py-1 text-xs"
                                >
                                  {selected.name}
                                  <button
                                    type="button"
                                    className="text-muted-foreground transition hover:text-foreground"
                                    onClick={() =>
                                      toggleMaterialUserSelection(selected.uid)
                                    }
                                  >
                                    <X className="size-3" />
                                  </button>
                                </span>
                              ))
                            )}
                          </div>
                          <div className="mt-3">
                            {materialUserSearch.trim().length === 0 ? (
                              <p className="text-xs text-muted-foreground">
                                Comece digitando para sugerir usuários.
                              </p>
                            ) : suggestedMaterialUsers.length === 0 ? (
                              <p className="text-xs text-muted-foreground">
                                Nenhum usuário corresponde à busca.
                              </p>
                            ) : (
                              <div className="space-y-2">
                                {suggestedMaterialUsers.map((user) => (
                                  <button
                                    key={user.uid}
                                    type="button"
                                    className="flex w-full items-center justify-between gap-3 rounded-md border border-transparent px-3 py-2 text-left text-sm transition hover:border-primary/20 hover:bg-muted/40"
                                    onClick={() =>
                                      toggleMaterialUserSelection(user.uid)
                                    }
                                  >
                                    <div>
                                      <p className="font-medium text-foreground">
                                        {user.name}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {user.email}
                                      </p>
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                      Adicionar
                                    </span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ) : null}

                {materialForm.visibility !== "private" ? (
                  <div className="space-y-2">
                    <Label>Liberação</Label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { value: "now", label: "Liberar agora" },
                        { value: "scheduled", label: "Agendar liberação" },
                      ].map((option) => {
                        const isActive = materialForm.scheduleMode === option.value
                        return (
                          <button
                            key={option.value}
                            type="button"
                            className={`flex-1 rounded-lg border px-3 py-2 text-left text-sm transition ${isActive
                                ? "border-primary/40 bg-primary/10 text-foreground"
                                : "border-muted-foreground/20 text-muted-foreground hover:border-primary/30"
                              }`}
                            onClick={() =>
                              setMaterialForm((prev) => ({
                                ...prev,
                                scheduleMode:
                                  option.value as MaterialForm["scheduleMode"],
                              }))
                            }
                          >
                            {option.label}
                          </button>
                        )
                      })}
                    </div>
                    {materialForm.scheduleMode === "scheduled" ? (
                      <div className="flex items-center gap-2">
                        <Calendar className="size-4 text-muted-foreground" />
                        <Input
                          type="datetime-local"
                          value={materialForm.releaseAt}
                          onChange={(event) =>
                            setMaterialForm((prev) => ({
                              ...prev,
                              releaseAt: event.target.value,
                            }))
                          }
                        />
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
                    Material privado fica oculto para alunos até ser liberado.
                  </div>
                )}

                {materialError ? (
                  <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                    {materialError}
                  </div>
                ) : null}

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    onClick={handleCreateMaterial}
                    disabled={creatingMaterial}
                  >
                    {creatingMaterial
                      ? "Criando material..."
                      : "Salvar material"}
                  </Button>
                  <Button
                    variant="outline"
                    disabled={creatingMaterial}
                    onClick={resetMaterialForm}
                  >
                    Limpar
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {loadingMaterials ? (
                  <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
                    Carregando materiais...
                  </div>
                ) : materials.length === 0 ? (
                  <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
                    Nenhum material cadastrado ainda.
                  </div>
                ) : (
                  tracks.map((track) => {
                    const trackMaterials = materials.filter(
                      (material) => material.trackId === track.id
                    )
                    if (!trackMaterials.length) {
                      return null
                    }
                    return (
                      <Card key={track.id} className="border-muted-foreground/20">
                        <CardHeader>
                          <CardTitle className="text-sm">{track.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {trackMaterials.map((material) => {
                            const hasMarkdown = Boolean(material.markdown?.trim())
                            const legacyType =
                              material.type && material.type !== "markdown"
                                ? material.type
                                : undefined
                            const primaryAttachmentType =
                              material.attachments?.[0]?.type ??
                              (legacyType as keyof typeof MATERIAL_TYPE_LABELS) ??
                              "link"
                            const typeLabel = hasMarkdown
                              ? "Markdown"
                              : MATERIAL_TYPE_LABELS[primaryAttachmentType]
                            const Icon = hasMarkdown
                              ? FileText
                              : MATERIAL_TYPE_ICONS[primaryAttachmentType]
                            const releaseLabel =
                              material.visibility === "private"
                                ? "Privado"
                                : material.releaseAt
                                  ? `Agendado para ${new Date(
                                    material.releaseAt as string
                                  ).toLocaleString()}`
                                  : "Liberado"

                            return (
                              <div
                                key={material.id}
                                className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm"
                              >
                                <div className="flex items-start gap-3">
                                  <Icon className="mt-0.5 size-4 text-muted-foreground" />
                                  <div>
                                    <p className="font-medium text-foreground">
                                      {material.title}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {typeLabel} • {releaseLabel}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground">
                                    {material.visibility === "users"
                                      ? `${material.userIds?.length ?? 0} usuários`
                                      : material.visibility === "module"
                                        ? "Módulo inteiro"
                                        : "Privado"}{" "}
                                    • {material.attachments?.length ?? 0} anexos
                                  </span>
                                  <Button
                                    size="xs"
                                    variant="destructive"
                                    disabled={deletingMaterialId === material.id}
                                    onClick={() => void handleDeleteMaterial(material)}
                                  >
                                    {deletingMaterialId === material.id
                                      ? "Excluindo..."
                                      : "Excluir"}
                                  </Button>
                                </div>
                              </div>
                            )
                          })}
                        </CardContent>
                      </Card>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>
        ) : null}

        {activeSection === "activities" ? (
          <Card>
            <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="text-base">Atividades do módulo</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Planeje atividades com liberação controlada e agendamento.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => void loadActivities(true)}
                disabled={loadingActivities}
              >
                Atualizar lista
              </Button>
            </CardHeader>
            <CardContent className="grid gap-6 lg:grid-cols-[1.2fr,1fr]">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="activity-track">Módulo</Label>
                  <select
                    id="activity-track"
                    className="bg-card text-foreground border-input h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                    value={activityForm.trackId}
                    onChange={(event) =>
                      setActivityForm((prev) => ({
                        ...prev,
                        trackId: event.target.value,
                      }))
                    }
                  >
                    <option value="">Selecione um módulo</option>
                    {tracks.map((track) => (
                      <option key={track.id} value={track.id}>
                        {track.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="activity-title">Título</Label>
                  <Input
                    id="activity-title"
                    placeholder="Ex.: Simulação de reunião"
                    value={activityForm.title}
                    onChange={(event) =>
                      setActivityForm((prev) => ({
                        ...prev,
                        title: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="activity-type">Tipo</Label>
                    <select
                      id="activity-type"
                      className="bg-card text-foreground border-input h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                      value={activityForm.type}
                      onChange={(event) =>
                        setActivityForm((prev) => ({
                          ...prev,
                          type: event.target.value as ActivityForm["type"],
                        }))
                      }
                    >
                      {Object.entries(ACTIVITY_TYPE_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="activity-minutes">Duração (min)</Label>
                    <Input
                      id="activity-minutes"
                      type="number"
                      min={1}
                      placeholder="Ex.: 45"
                      value={activityForm.estimatedMinutes}
                      onChange={(event) =>
                        setActivityForm((prev) => ({
                          ...prev,
                          estimatedMinutes: event.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="activity-order">Ordem (opcional)</Label>
                  <Input
                    id="activity-order"
                    type="number"
                    min={1}
                    placeholder="Ex.: 2"
                    value={activityForm.order}
                    onChange={(event) =>
                      setActivityForm((prev) => ({
                        ...prev,
                        order: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Disponibilidade</Label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      {
                        value: "module",
                        label: "Módulo inteiro",
                        description: "Todos do módulo",
                      },
                      {
                        value: "users",
                        label: "Usuários específicos",
                        description: "Selecionar usuários",
                      },
                      {
                        value: "private",
                        label: "Privado",
                        description: "Rascunho interno",
                      },
                    ].map((option) => {
                      const isActive = activityForm.visibility === option.value
                      return (
                        <button
                          key={option.value}
                          type="button"
                          className={`flex-1 rounded-lg border px-3 py-2 text-left text-sm transition ${isActive
                              ? "border-primary/40 bg-primary/10 text-foreground"
                              : "border-muted-foreground/20 text-muted-foreground hover:border-primary/30"
                            }`}
                          onClick={() => {
                            setActivityForm((prev) => ({
                              ...prev,
                              visibility: option.value as ActivityForm["visibility"],
                              userIds: option.value === "users" ? prev.userIds : [],
                              scheduleMode:
                                option.value === "private"
                                  ? "now"
                                  : prev.scheduleMode,
                              releaseAt:
                                option.value === "private" ? "" : prev.releaseAt,
                            }))
                          }}
                        >
                          <p className="font-medium">{option.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {option.description}
                          </p>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {activityForm.visibility === "users" ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="activity-user-search">
                        Usuários liberados
                      </Label>
                      <span className="text-xs text-muted-foreground">
                        {activityForm.userIds.length} selecionado(s)
                      </span>
                    </div>
                    <Input
                      id="activity-user-search"
                      placeholder="Buscar por nome ou email"
                      value={activityUserSearch}
                      onChange={(event) =>
                        setActivityUserSearch(event.target.value)
                      }
                    />
                    <div className="rounded-lg border border-dashed p-3">
                      {loadingUsers ? (
                        <p className="text-sm text-muted-foreground">
                          Carregando usuários...
                        </p>
                      ) : userError ? (
                        <p className="text-sm text-destructive">{userError}</p>
                      ) : (
                        <>
                          <div className="flex flex-wrap gap-2">
                            {selectedActivityUsers.length === 0 ? (
                              <span className="text-sm text-muted-foreground">
                                Nenhum usuário selecionado.
                              </span>
                            ) : (
                              selectedActivityUsers.map((selected) => (
                                <span
                                  key={selected.uid}
                                  className="inline-flex items-center gap-2 rounded-full border bg-muted px-3 py-1 text-xs"
                                >
                                  {selected.name}
                                  <button
                                    type="button"
                                    className="text-muted-foreground transition hover:text-foreground"
                                    onClick={() =>
                                      toggleActivityUserSelection(selected.uid)
                                    }
                                  >
                                    <X className="size-3" />
                                  </button>
                                </span>
                              ))
                            )}
                          </div>
                          <div className="mt-3">
                            {activityUserSearch.trim().length === 0 ? (
                              <p className="text-xs text-muted-foreground">
                                Comece digitando para sugerir usuários.
                              </p>
                            ) : suggestedActivityUsers.length === 0 ? (
                              <p className="text-xs text-muted-foreground">
                                Nenhum usuário corresponde à busca.
                              </p>
                            ) : (
                              <div className="space-y-2">
                                {suggestedActivityUsers.map((user) => (
                                  <button
                                    key={user.uid}
                                    type="button"
                                    className="flex w-full items-center justify-between gap-3 rounded-md border border-transparent px-3 py-2 text-left text-sm transition hover:border-primary/20 hover:bg-muted/40"
                                    onClick={() =>
                                      toggleActivityUserSelection(user.uid)
                                    }
                                  >
                                    <div>
                                      <p className="font-medium text-foreground">
                                        {user.name}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {user.email}
                                      </p>
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                      Adicionar
                                    </span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ) : null}

                {activityForm.visibility !== "private" ? (
                  <div className="space-y-2">
                    <Label>Liberação</Label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { value: "now", label: "Liberar agora" },
                        { value: "scheduled", label: "Agendar liberação" },
                      ].map((option) => {
                        const isActive = activityForm.scheduleMode === option.value
                        return (
                          <button
                            key={option.value}
                            type="button"
                            className={`flex-1 rounded-lg border px-3 py-2 text-left text-sm transition ${isActive
                                ? "border-primary/40 bg-primary/10 text-foreground"
                                : "border-muted-foreground/20 text-muted-foreground hover:border-primary/30"
                              }`}
                            onClick={() =>
                              setActivityForm((prev) => ({
                                ...prev,
                                scheduleMode:
                                  option.value as ActivityForm["scheduleMode"],
                              }))
                            }
                          >
                            {option.label}
                          </button>
                        )
                      })}
                    </div>
                    {activityForm.scheduleMode === "scheduled" ? (
                      <div className="flex items-center gap-2">
                        <Calendar className="size-4 text-muted-foreground" />
                        <Input
                          type="datetime-local"
                          value={activityForm.releaseAt}
                          onChange={(event) =>
                            setActivityForm((prev) => ({
                              ...prev,
                              releaseAt: event.target.value,
                            }))
                          }
                        />
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
                    Atividade privada fica ocultada até ser liberada.
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Anexos</Label>
                  <div className="space-y-3">
                    {activityForm.attachments.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Nenhum anexo adicionado. Adicione arquivos ou links de apoio.
                      </p>
                    ) : (
                      activityForm.attachments.map((attachment, index) => (
                        <div
                          key={`${attachment.url}-${index}`}
                          className="grid gap-2 rounded-lg border p-3 md:grid-cols-[160px,1fr,1.2fr,auto]"
                        >
                          <select
                            className="bg-card text-foreground border-input h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                            value={attachment.type}
                            onChange={(event) =>
                              setActivityForm((prev) => {
                                const next = [...prev.attachments]
                                next[index] = {
                                  ...next[index],
                                  type: event.target.value as ActivityForm["attachments"][number]["type"],
                                }
                                return { ...prev, attachments: next }
                              })
                            }
                          >
                            {Object.entries(MATERIAL_TYPE_LABELS).map(([key, label]) => (
                              <option key={key} value={key}>
                                {label}
                              </option>
                            ))}
                          </select>
                          <Input
                            placeholder="Nome do anexo"
                            value={attachment.name}
                            onChange={(event) =>
                              setActivityForm((prev) => {
                                const next = [...prev.attachments]
                                next[index] = {
                                  ...next[index],
                                  name: event.target.value,
                                }
                                return { ...prev, attachments: next }
                              })
                            }
                          />
                          <Input
                            placeholder="https://arquivo..."
                            value={attachment.url}
                            onChange={(event) =>
                              setActivityForm((prev) => {
                                const next = [...prev.attachments]
                                next[index] = {
                                  ...next[index],
                                  url: event.target.value,
                                }
                                return { ...prev, attachments: next }
                              })
                            }
                          />
                          <Button
                            variant="outline"
                            onClick={() =>
                              setActivityForm((prev) => ({
                                ...prev,
                                attachments: prev.attachments.filter(
                                  (_, itemIndex) => itemIndex !== index
                                ),
                              }))
                            }
                          >
                            Remover
                          </Button>
                        </div>
                      ))
                    )}
                    <Button
                      variant="outline"
                      onClick={() =>
                        setActivityForm((prev) => ({
                          ...prev,
                          attachments: [
                            ...prev.attachments,
                            { name: "", url: "", type: "pdf" },
                          ],
                        }))
                      }
                    >
                      Adicionar anexo
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Questões</Label>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setActivityForm((prev) => ({
                          ...prev,
                          questions: [
                            ...prev.questions,
                            {
                              id: `q-${prev.questions.length + 1}`,
                              type: "essay",
                              prompt: "",
                              options: [],
                              correctAnswers: [],
                              points: "",
                              required: false,
                            },
                          ],
                        }))
                      }
                    >
                      Adicionar questão
                    </Button>
                  </div>

                  {activityForm.questions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Nenhuma questão adicionada.
                    </p>
                  ) : (
                    activityForm.questions.map((question, index) => (
                      <div
                        key={question.id}
                        className="space-y-3 rounded-lg border p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="text-sm font-medium">
                            Questão {index + 1}
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setActivityForm((prev) => ({
                                ...prev,
                                questions: prev.questions.filter(
                                  (_, itemIndex) => itemIndex !== index
                                ),
                              }))
                            }
                          >
                            Remover
                          </Button>
                        </div>
                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Tipo</Label>
                            <select
                              className="bg-card text-foreground border-input h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                              value={question.type}
                              onChange={(event) =>
                                setActivityForm((prev) => {
                                  const next = [...prev.questions]
                                  next[index] = {
                                    ...next[index],
                                    type: event.target.value as ActivityForm["questions"][number]["type"],
                                    options:
                                      event.target.value === "essay" ||
                                        event.target.value === "short_answer" ||
                                        event.target.value === "true_false"
                                        ? []
                                        : next[index].options,
                                    correctAnswers:
                                      event.target.value === "essay"
                                        ? []
                                        : next[index].correctAnswers,
                                  }
                                  return { ...prev, questions: next }
                                })
                              }
                            >
                              <option value="essay">Dissertativa</option>
                              <option value="short_answer">Resposta curta</option>
                              <option value="single_choice">Escolha única</option>
                              <option value="multiple_choice">Múltipla escolha</option>
                              <option value="true_false">Verdadeiro/Falso</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <Label>Pontuação</Label>
                            <Input
                              type="number"
                              min={0}
                              placeholder="Ex.: 10"
                              value={question.points}
                              onChange={(event) =>
                                setActivityForm((prev) => {
                                  const next = [...prev.questions]
                                  next[index] = {
                                    ...next[index],
                                    points: event.target.value,
                                  }
                                  return { ...prev, questions: next }
                                })
                              }
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Enunciado</Label>
                          <textarea
                            className="bg-card text-foreground border-input min-h-24 w-full rounded-md border p-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                            placeholder="Descreva a pergunta"
                            value={question.prompt}
                            onChange={(event) =>
                              setActivityForm((prev) => {
                                const next = [...prev.questions]
                                next[index] = {
                                  ...next[index],
                                  prompt: event.target.value,
                                }
                                return { ...prev, questions: next }
                              })
                            }
                          />
                        </div>

                        {(question.type === "single_choice" ||
                          question.type === "multiple_choice") && (
                            <div className="space-y-2">
                              <Label>Opções</Label>
                              <div className="space-y-2">
                                {(question.options.length ? question.options : [""]).map(
                                  (option, optionIndex) => (
                                    <div
                                      key={`${question.id}-opt-${optionIndex}`}
                                      className="flex items-center gap-2"
                                    >
                                      <Input
                                        placeholder={`Opção ${optionIndex + 1}`}
                                        value={option}
                                        onChange={(event) =>
                                          setActivityForm((prev) => {
                                            const next = [...prev.questions]
                                            const options = [...next[index].options]
                                            options[optionIndex] = event.target.value
                                            next[index] = {
                                              ...next[index],
                                              options,
                                            }
                                            return { ...prev, questions: next }
                                          })
                                        }
                                      />
                                      <Button
                                        variant="outline"
                                        onClick={() =>
                                          setActivityForm((prev) => {
                                            const next = [...prev.questions]
                                            const options = next[index].options.filter(
                                              (_, idx) => idx !== optionIndex
                                            )
                                            next[index] = {
                                              ...next[index],
                                              options,
                                            }
                                            return { ...prev, questions: next }
                                          })
                                        }
                                      >
                                        Remover
                                      </Button>
                                    </div>
                                  )
                                )}
                                <Button
                                  variant="outline"
                                  onClick={() =>
                                    setActivityForm((prev) => {
                                      const next = [...prev.questions]
                                      next[index] = {
                                        ...next[index],
                                        options: [...next[index].options, ""],
                                      }
                                      return { ...prev, questions: next }
                                    })
                                  }
                                >
                                  Adicionar opção
                                </Button>
                              </div>
                            </div>
                          )}

                        {question.type === "true_false" && (
                          <div className="space-y-2">
                            <Label>Resposta correta</Label>
                            <select
                              className="bg-card text-foreground border-input h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                              value={question.correctAnswers[0] ?? ""}
                              onChange={(event) =>
                                setActivityForm((prev) => {
                                  const next = [...prev.questions]
                                  next[index] = {
                                    ...next[index],
                                    correctAnswers: event.target.value
                                      ? [event.target.value]
                                      : [],
                                  }
                                  return { ...prev, questions: next }
                                })
                              }
                            >
                              <option value="">Selecione</option>
                              <option value="true">Verdadeiro</option>
                              <option value="false">Falso</option>
                            </select>
                          </div>
                        )}

                        {question.type === "single_choice" && (
                          <div className="space-y-2">
                            <Label>Resposta correta</Label>
                            <select
                              className="bg-card text-foreground border-input h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                              value={question.correctAnswers[0] ?? ""}
                              onChange={(event) =>
                                setActivityForm((prev) => {
                                  const next = [...prev.questions]
                                  next[index] = {
                                    ...next[index],
                                    correctAnswers: event.target.value
                                      ? [event.target.value]
                                      : [],
                                  }
                                  return { ...prev, questions: next }
                                })
                              }
                            >
                              <option value="">Selecione</option>
                              {question.options.map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {question.type === "multiple_choice" && (
                          <div className="space-y-2">
                            <Label>Respostas corretas</Label>
                            <div className="space-y-2">
                              {question.options.map((option) => {
                                const checked = question.correctAnswers.includes(option)
                                return (
                                  <label
                                    key={option}
                                    className="flex items-center gap-2 text-sm"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() =>
                                        setActivityForm((prev) => {
                                          const next = [...prev.questions]
                                          const current = next[index].correctAnswers
                                          const nextAnswers = checked
                                            ? current.filter((item) => item !== option)
                                            : [...current, option]
                                          next[index] = {
                                            ...next[index],
                                            correctAnswers: nextAnswers,
                                          }
                                          return { ...prev, questions: next }
                                        })
                                      }
                                    />
                                    {option}
                                  </label>
                                )
                              })}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <input
                            type="checkbox"
                            checked={question.required}
                            onChange={(event) =>
                              setActivityForm((prev) => {
                                const next = [...prev.questions]
                                next[index] = {
                                  ...next[index],
                                  required: event.target.checked,
                                }
                                return { ...prev, questions: next }
                              })
                            }
                          />
                          Resposta obrigatória
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {activityError ? (
                  <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                    {activityError}
                  </div>
                ) : null}

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    onClick={handleCreateActivity}
                    disabled={creatingActivity}
                  >
                    {creatingActivity
                      ? "Criando atividade..."
                      : "Salvar atividade"}
                  </Button>
                  <Button
                    variant="outline"
                    disabled={creatingActivity}
                    onClick={resetActivityForm}
                  >
                    Limpar
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {loadingActivities ? (
                  <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
                    Carregando atividades...
                  </div>
                ) : activities.length === 0 ? (
                  <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
                    Nenhuma atividade cadastrada ainda.
                  </div>
                ) : (
                  tracks.map((track) => {
                    const trackActivities = activities.filter(
                      (activity) => activity.trackId === track.id
                    )
                    if (!trackActivities.length) {
                      return null
                    }
                    return (
                      <Card key={track.id} className="border-muted-foreground/20">
                        <CardHeader>
                          <CardTitle className="text-sm">{track.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {trackActivities.map((activity) => {
                            const Icon =
                              ACTIVITY_TYPE_ICONS[activity.type ?? "lesson"]
                            const releaseLabel =
                              activity.visibility === "private"
                                ? "Privado"
                                : activity.releaseAt
                                  ? `Agendado para ${new Date(
                                    activity.releaseAt as string
                                  ).toLocaleString()}`
                                  : "Liberado"

                            return (
                              <div
                                key={activity.id}
                                className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm"
                              >
                                <div className="flex items-start gap-3">
                                  <Icon className="mt-0.5 size-4 text-muted-foreground" />
                                  <div>
                                    <p className="font-medium text-foreground">
                                      {activity.title}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {ACTIVITY_TYPE_LABELS[
                                        activity.type ?? "lesson"
                                      ]}{" "}
                                      • Ordem {activity.order} •{" "}
                                      {activity.estimatedMinutes} min • {releaseLabel}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground">
                                    {activity.visibility === "users"
                                      ? `${activity.userIds?.length ?? 0} usuários`
                                      : activity.visibility === "module"
                                        ? "Módulo inteiro"
                                        : "Privado"}{" "}
                                    • {activity.attachments?.length ?? 0} anexos •{" "}
                                    {activity.questions?.length ?? 0} questões
                                  </span>
                                  <Button
                                    size="xs"
                                    variant="destructive"
                                    disabled={deletingActivityId === activity.id}
                                    onClick={() => void handleDeleteActivity(activity)}
                                  >
                                    {deletingActivityId === activity.id
                                      ? "Excluindo..."
                                      : "Excluir"}
                                  </Button>
                                </div>
                              </div>
                            )
                          })}
                        </CardContent>
                      </Card>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  )
}
