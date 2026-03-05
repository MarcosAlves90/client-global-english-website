"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import type {
    Activity,
    AdminActivityResponse,
    AdminCourseSummary,
    AdminUserSummary,
    Material,
    Track,
} from "@/lib/firebase/types"
import { useAuth } from "@/hooks/use-auth"
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
    updateAdminMaterial,
} from "@/modules/materials"
import {
    createAdminActivity,
    fetchAdminActivityProgress,
    deleteAdminActivity,
    fetchAdminCourseActivities,
} from "@/modules/activities"
import { deleteAdminAttachment } from "@/modules/attachments"
import { fetchAdminUsersPage } from "@/modules/users"
import { toast } from "sonner"

export type TrackForm = {
    title: string
    description: string
    order: string
    userIds: string[]
}

export type MaterialForm = {
    trackId: string
    title: string
    visibility: "module" | "users" | "private"
    userIds: string[]
    scheduleMode: "now" | "scheduled"
    releaseAt: string
    markdown: string
    attachments: { name: string; url: string; type: "pdf" | "video" | "link" | "audio" }[]
}

export type UpdateMaterialForm = {
    id: string
    title: string
    markdown: string
}

export type ActivityForm = {
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

interface CourseManagementContextType {
    courseId: string
    course: AdminCourseSummary | null
    tracks: Track[]
    materials: Material[]
    activities: Activity[]
    activityResponses: AdminActivityResponse[]
    availableUsers: AdminUserSummary[]
    loading: {
        course: boolean
        tracks: boolean
        materials: boolean
        activities: boolean
        responses: boolean
        users: boolean
    }
    errors: {
        global: string | null
        track: string | null
        material: string | null
        activity: string | null
        user: string | null
    }
    // Track Actions
    loadTracks: (force?: boolean) => Promise<void>
    handleDeleteTrack: (track: Track) => Promise<void>
    handleCreateOrUpdateTrack: (form: TrackForm, isEditing: boolean, editingTrackId: string | null) => Promise<void>

    // Material Actions
    loadMaterials: (force?: boolean) => Promise<void>
    handleDeleteMaterial: (material: Material) => Promise<void>
    handleCreateMaterial: (form: MaterialForm) => Promise<boolean>
    handleUpdateMaterial: (form: UpdateMaterialForm) => Promise<void>
    handleDeleteMaterialAttachment: (materialId: string, attachmentUrl: string) => Promise<void>

    // Activity Actions
    loadActivities: (force?: boolean) => Promise<void>
    loadActivityResponses: (force?: boolean) => Promise<void>
    handleDeleteActivity: (activity: Activity) => Promise<void>
    handleCreateActivity: (form: ActivityForm) => Promise<boolean>
    handleDeleteActivityAttachment: (activityId: string, attachmentUrl: string) => Promise<void>
}

const CourseManagementContext = React.createContext<CourseManagementContextType | undefined>(undefined)

export function CourseManagementProvider({ children }: { children: React.ReactNode }) {
    const { user, isFirebaseReady } = useAuth()
    const params = useParams<{ courseId?: string }>()
    const courseId = (Array.isArray(params?.courseId) ? params.courseId[0] : params?.courseId) || ""

    const [course, setCourse] = React.useState<AdminCourseSummary | null>(null)
    const [tracks, setTracks] = React.useState<Track[]>([])
    const [materials, setMaterials] = React.useState<Material[]>([])
    const [activities, setActivities] = React.useState<Activity[]>([])
    const [activityResponses, setActivityResponses] = React.useState<AdminActivityResponse[]>([])
    const [availableUsers, setAvailableUsers] = React.useState<AdminUserSummary[]>([])

    const [loading, setLoading] = React.useState({
        course: false,
        tracks: false,
        materials: false,
        activities: false,
        responses: false,
        users: false,
    })

    const [errors, setErrors] = React.useState<{
        global: string | null
        track: string | null
        material: string | null
        activity: string | null
        user: string | null
    }>({
        global: null,
        track: null,
        material: null,
        activity: null,
        user: null,
    })

    const loadCourse = React.useCallback(async () => {
        if (!courseId || !user) return
        try {
            setLoading(prev => ({ ...prev, course: true }))
            const idToken = await user.getIdToken()
            const data = await fetchAdminCourses(idToken)
            const match = data.find(c => c.id === courseId) ?? null
            setCourse(match)
        } catch {
            setErrors(prev => ({ ...prev, global: "Erro ao carregar curso" }))
        } finally {
            setLoading(prev => ({ ...prev, course: false }))
        }
    }, [courseId, user])

    const loadTracks = React.useCallback(async (force?: boolean) => {
        if (!courseId || !user) return
        try {
            setLoading(prev => ({ ...prev, tracks: true }))
            const idToken = await user.getIdToken()
            const data = await fetchAdminCourseTracks(idToken, courseId, { force })
            setTracks(data)
        } catch {
            setErrors(prev => ({ ...prev, track: "Erro ao carregar módulos" }))
        } finally {
            setLoading(prev => ({ ...prev, tracks: false }))
        }
    }, [courseId, user])

    const loadMaterials = React.useCallback(async (force?: boolean) => {
        if (!courseId || !user) return
        try {
            setLoading(prev => ({ ...prev, materials: true }))
            const idToken = await user.getIdToken()
            const data = await fetchAdminCourseMaterials(idToken, courseId, { force })
            setMaterials(data)
        } catch {
            setErrors(prev => ({ ...prev, material: "Erro ao carregar materiais" }))
        } finally {
            setLoading(prev => ({ ...prev, materials: false }))
        }
    }, [courseId, user])

    const loadActivities = React.useCallback(async (force?: boolean) => {
        if (!courseId || !user) return
        try {
            setLoading(prev => ({ ...prev, activities: true }))
            const idToken = await user.getIdToken()
            const data = await fetchAdminCourseActivities(idToken, courseId, { force })
            setActivities(data)
        } catch {
            setErrors(prev => ({ ...prev, activity: "Erro ao carregar atividades" }))
        } finally {
            setLoading(prev => ({ ...prev, activities: false }))
        }
    }, [courseId, user])

    const loadActivityResponses = React.useCallback(async (force?: boolean) => {
        if (!courseId || !user) return
        try {
            setLoading(prev => ({ ...prev, responses: true }))
            const idToken = await user.getIdToken()
            const data = await fetchAdminActivityProgress({
                idToken,
                courseId,
                force,
            })
            setActivityResponses(data)
        } catch {
            setErrors(prev => ({ ...prev, activity: "Erro ao carregar respostas das atividades" }))
        } finally {
            setLoading(prev => ({ ...prev, responses: false }))
        }
    }, [courseId, user])

    const loadUsers = React.useCallback(async () => {
        if (!user) return
        try {
            setLoading(prev => ({ ...prev, users: true }))
            const idToken = await user.getIdToken()
            const data = await fetchAdminUsersPage({ idToken, pageSize: 100, cursor: null })
            setAvailableUsers(data.items)
        } catch {
            setErrors(prev => ({ ...prev, user: "Erro ao carregar usuários" }))
        } finally {
            setLoading(prev => ({ ...prev, users: false }))
        }
    }, [user])

    // Track Handlers
    const handleCreateOrUpdateTrack = async (form: TrackForm, isEditing: boolean, editingTrackId: string | null) => {
        if (!user) return
        try {
            const idToken = await user.getIdToken()
            if (isEditing && editingTrackId) {
                await updateAdminCourseTrack(idToken, {
                    id: editingTrackId,
                    title: form.title,
                    description: form.description,
                    order: form.order ? Number(form.order) : undefined,
                    userIds: form.userIds,
                })
                toast.success("Módulo atualizado com sucesso")
            } else {
                await createAdminCourseTrack(idToken, {
                    courseId,
                    title: form.title,
                    description: form.description,
                    order: form.order ? Number(form.order) : undefined,
                    userIds: form.userIds,
                })
                toast.success("Módulo criado com sucesso")
            }
            void loadTracks(true)
        } catch {
            setErrors(prev => ({ ...prev, track: "Erro ao salvar módulo" }))
            toast.error("Erro ao salvar módulo")
        }
    }

    const handleDeleteTrack = async (track: Track) => {
        if (!user || !window.confirm(`Excluir o módulo "${track.title}"?`)) return
        try {
            const idToken = await user.getIdToken()
            await deleteAdminCourseTrack(idToken, track.id)
            toast.success("Módulo excluído")
            void loadTracks(true)
        } catch {
            toast.error("Erro ao excluir módulo")
        }
    }

    // Material Handlers
    const handleCreateMaterial = async (form: MaterialForm) => {
        if (!user) return false
        try {
            const idToken = await user.getIdToken()
            await createAdminMaterial(idToken, {
                courseId,
                trackId: form.trackId,
                title: form.title,
                visibility: form.visibility,
                userIds: form.userIds,
                releaseAt: form.scheduleMode === "scheduled" ? form.releaseAt : null,
                markdown: form.markdown,
                attachments: form.attachments,
            })
            toast.success("Material criado")
            void loadMaterials(true)
            return true
        } catch {
            toast.error("Erro ao criar material")
            return false
        }
    }

    const handleDeleteMaterial = async (material: Material) => {
        if (!user || !window.confirm(`Excluir o material "${material.title}"?`)) return
        try {
            const idToken = await user.getIdToken()
            await deleteAdminMaterial(idToken, material.id)
            toast.success("Material excluído")
            void loadMaterials(true)
        } catch {
            toast.error("Erro ao excluir material")
        }
    }

    const handleUpdateMaterial = async (form: UpdateMaterialForm) => {
        if (!user) return
        try {
            const idToken = await user.getIdToken()
            await updateAdminMaterial(idToken, {
                id: form.id,
                title: form.title,
                markdown: form.markdown,
            })
            toast.success("Material atualizado")
            void loadMaterials(true)
        } catch {
            toast.error("Erro ao atualizar material")
        }
    }

    const handleDeleteMaterialAttachment = async (materialId: string, attachmentUrl: string) => {
        if (!user) return
        try {
            const idToken = await user.getIdToken()
            await deleteAdminAttachment(idToken, {
                entityType: "material",
                entityId: materialId,
                attachmentUrl,
            })
            toast.success("Anexo removido")
            void loadMaterials(true)
        } catch {
            toast.error("Erro ao remover anexo")
        }
    }

    // Activity Handlers
    const handleCreateActivity = async (form: ActivityForm) => {
        if (!user) return false
        try {
            const idToken = await user.getIdToken()
            await createAdminActivity(idToken, {
                courseId,
                trackId: form.trackId,
                title: form.title,
                type: form.type,
                estimatedMinutes: form.estimatedMinutes ? Number(form.estimatedMinutes) : 0,
                order: form.order ? Number(form.order) : 0,
                visibility: form.visibility,
                userIds: form.userIds,
                releaseAt: form.scheduleMode === "scheduled" ? form.releaseAt : null,
                attachments: form.attachments,
                questions: form.questions.map(q => ({
                    ...q,
                    points: q.points ? Number(q.points) : 0,
                })),
            })
            toast.success("Atividade criada")
            void loadActivities(true)
            void loadActivityResponses(true)
            return true
        } catch {
            toast.error("Erro ao criar atividade")
            return false
        }
    }

    const handleDeleteActivity = async (activity: Activity) => {
        if (!user || !window.confirm(`Excluir a atividade "${activity.title}"?`)) return
        try {
            const idToken = await user.getIdToken()
            await deleteAdminActivity(idToken, activity.id)
            toast.success("Atividade excluída")
            void loadActivities(true)
            void loadActivityResponses(true)
        } catch {
            toast.error("Erro ao excluir atividade")
        }
    }

    const handleDeleteActivityAttachment = async (activityId: string, attachmentUrl: string) => {
        if (!user) return
        try {
            const idToken = await user.getIdToken()
            await deleteAdminAttachment(idToken, {
                entityType: "activity",
                entityId: activityId,
                attachmentUrl,
            })
            toast.success("Anexo removido")
            void loadActivities(true)
        } catch {
            toast.error("Erro ao remover anexo")
        }
    }

    React.useEffect(() => {
        if (isFirebaseReady && user) {
            void loadCourse()
            void loadTracks()
            void loadMaterials()
            void loadActivities()
            void loadActivityResponses()
            void loadUsers()
        }
    }, [isFirebaseReady, user, loadCourse, loadTracks, loadMaterials, loadActivities, loadActivityResponses, loadUsers])

    const value = {
        courseId,
        course,
        tracks,
        materials,
        activities,
        activityResponses,
        availableUsers,
        loading,
        errors,
        loadTracks,
        handleDeleteTrack,
        handleCreateOrUpdateTrack,
        loadMaterials,
        handleDeleteMaterial,
        handleCreateMaterial,
        handleUpdateMaterial,
        handleDeleteMaterialAttachment,
        loadActivities,
        handleDeleteActivity,
        handleCreateActivity,
        handleDeleteActivityAttachment,
        loadActivityResponses,
    }

    return (
        <CourseManagementContext.Provider value={value}>
            {children}
        </CourseManagementContext.Provider>
    )
}

export function useCourseManagement() {
    const context = React.useContext(CourseManagementContext)
    if (context === undefined) {
        throw new Error("useCourseManagement must be used within a CourseManagementProvider")
    }
    return context
}
