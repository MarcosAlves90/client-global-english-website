import * as React from "react"
import { toast } from "sonner"

import { deleteAdminAttachment } from "@/modules/attachments"
import {
  createAdminCourseTrack,
  deleteAdminCourseTrack,
  updateAdminCourseTrack,
} from "@/modules/tracks"
import {
  createAdminMaterial,
  deleteAdminMaterial,
  updateAdminMaterial,
} from "@/modules/materials"
import {
  createAdminActivity,
  deleteAdminActivity,
} from "@/modules/activities"
import type {
  Activity,
  Material,
  Track,
} from "@/lib/firebase/types"
import type {
  ActivityForm,
  MaterialForm,
  TrackForm,
} from "./courseManagement.types"

type UseCourseManagementActionsArgs = {
  courseId: string
  user: {
    getIdToken: () => Promise<string>
  } | null
  loadTracks: (force?: boolean) => Promise<void>
  loadMaterials: (force?: boolean) => Promise<void>
  loadActivities: (force?: boolean) => Promise<void>
  loadActivityResponses: (force?: boolean) => Promise<void>
}

export function useCourseManagementActions({
  courseId,
  user,
  loadTracks,
  loadMaterials,
  loadActivities,
  loadActivityResponses,
}: UseCourseManagementActionsArgs) {
  const handleCreateOrUpdateTrack = React.useCallback(
    async (form: TrackForm, isEditing: boolean, editingTrackId: string | null) => {
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
        toast.error("Erro ao salvar módulo")
      }
    },
    [courseId, loadTracks, user]
  )

  const handleDeleteTrack = React.useCallback(
    async (track: Track) => {
      if (!user || !window.confirm(`Excluir o módulo "${track.title}"?`)) return
      try {
        const idToken = await user.getIdToken()
        await deleteAdminCourseTrack(idToken, track.id)
        toast.success("Módulo excluído")
        void loadTracks(true)
      } catch {
        toast.error("Erro ao excluir módulo")
      }
    },
    [loadTracks, user]
  )

  const handleCreateMaterial = React.useCallback(
    async (form: MaterialForm) => {
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
    },
    [courseId, loadMaterials, user]
  )

  const handleDeleteMaterial = React.useCallback(
    async (material: Material) => {
      if (!user || !window.confirm(`Excluir o material "${material.title}"?`)) return
      try {
        const idToken = await user.getIdToken()
        await deleteAdminMaterial(idToken, material.id)
        toast.success("Material excluído")
        void loadMaterials(true)
      } catch {
        toast.error("Erro ao excluir material")
      }
    },
    [loadMaterials, user]
  )

  const handleUpdateMaterial = React.useCallback(
    async (form: { id: string; title: string; markdown: string }) => {
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
    },
    [loadMaterials, user]
  )

  const handleDeleteMaterialAttachment = React.useCallback(
    async (materialId: string, attachmentUrl: string) => {
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
    },
    [loadMaterials, user]
  )

  const handleCreateActivity = React.useCallback(
    async (form: ActivityForm) => {
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
          questions: form.questions.map((q) => ({
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
    },
    [courseId, loadActivities, loadActivityResponses, user]
  )

  const handleDeleteActivity = React.useCallback(
    async (activity: Activity) => {
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
    },
    [loadActivities, loadActivityResponses, user]
  )

  const handleDeleteActivityAttachment = React.useCallback(
    async (activityId: string, attachmentUrl: string) => {
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
    },
    [loadActivities, user]
  )

  return {
    handleDeleteTrack,
    handleCreateOrUpdateTrack,
    handleDeleteMaterial,
    handleCreateMaterial,
    handleUpdateMaterial,
    handleDeleteMaterialAttachment,
    handleDeleteActivity,
    handleCreateActivity,
    handleDeleteActivityAttachment,
  }
}
