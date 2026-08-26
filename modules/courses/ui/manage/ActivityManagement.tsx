"use client"

import * as React from "react"
import { toast } from "sonner"

import { deleteMediaByUrl, uploadMedia } from "@/lib/cloudinary-actions"
import type { Activity } from "@/lib/firebase/types"
import { inferMediaAttachmentType } from "@/lib/media/audio"
import { ActivityCreator } from "./ActivityCreator"
import { ActivityInsightsPanel } from "./ActivityInsightsPanel"
import { ManagementGrid } from "./ManagementGrid"
import { useCourseManagement } from "./CourseManagementContext"

type ActivityManagementProps = Readonly<{
  showCreatePanel: boolean
}>

export function ActivityManagement({ showCreatePanel }: ActivityManagementProps) {
  const {
    course,
    tracks,
    activities,
    activityResponses,
    availableUsers,
    loading,
    handleCreateActivity,
    handleDeleteActivity,
    handleDeleteActivityAttachment,
    handleUpdateActivityAttachments,
  } = useCourseManagement()

  const [attachingActivityId, setAttachingActivityId] = React.useState<string | null>(null)

  const cleanupUploadedAttachments = React.useCallback(async (
    attachments: NonNullable<Activity["attachments"]>
  ) => {
    await Promise.all(
      attachments.map(async (attachment) => {
        try {
          await deleteMediaByUrl(attachment.url)
        } catch (error) {
          console.error("Activity attachment rollback failed", error)
        }
      })
    )
  }, [])

  const addAttachmentsToActivity = React.useCallback(async (
    activity: Activity,
    files: File[]
  ) => {
    if (!files.length || attachingActivityId) return
    setAttachingActivityId(activity.id)
    const uploaded: NonNullable<Activity["attachments"]> = []

    try {
      for (const file of files) {
        const formData = new FormData()
        formData.append("file", file)
        const result = await uploadMedia(formData, "activities")
        uploaded.push({
          name: file.name,
          url: result.secure_url,
          type: inferMediaAttachmentType(file),
        })
      }

      const success = await handleUpdateActivityAttachments(
        activity.id,
        [...(activity.attachments ?? []), ...uploaded]
      )
      if (!success) await cleanupUploadedAttachments(uploaded)
    } catch (error) {
      console.error("Post-create activity attachment upload failed", error)
      await cleanupUploadedAttachments(uploaded)
      toast.error("Erro ao adicionar anexos à atividade")
    } finally {
      setAttachingActivityId(null)
    }
  }, [attachingActivityId, cleanupUploadedAttachments, handleUpdateActivityAttachments])

  const handleCopyAttachmentLink = React.useCallback(async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      toast.success("Link do anexo copiado")
    } catch {
      toast.error("Nao foi possível copiar o link")
    }
  }, [])

  return (
    <ManagementGrid showCreatePanel={showCreatePanel}>
      {showCreatePanel ? (
        <div className="flex flex-col gap-6">
          <ActivityCreator
            tracks={tracks}
            availableUsers={availableUsers}
            onCreate={handleCreateActivity}
          />
        </div>
      ) : null}

      <ActivityInsightsPanel
        loading={loading}
        activities={activities}
        tracks={tracks}
        activityResponses={activityResponses}
        courseStudentCount={course?.studentsCount ?? 0}
        onDeleteActivity={handleDeleteActivity}
        onDeleteActivityAttachment={handleDeleteActivityAttachment}
        onCopyAttachmentLink={handleCopyAttachmentLink}
        attachingActivityId={attachingActivityId}
        onAddActivityAttachments={addAttachmentsToActivity}
      />
    </ManagementGrid>
  )
}
