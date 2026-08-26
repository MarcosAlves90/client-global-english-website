"use client"

import * as React from "react"
import { toast } from "sonner"

import { validateActivitySchedule } from "@/lib/activities/deadlines"
import { deleteMediaByUrl, uploadMedia } from "@/lib/cloudinary-actions"
import { inferMediaAttachmentType } from "@/lib/media/audio"
import { ActivityCreationPanel, type ActivityValidationErrors } from "./ActivityCreationPanel"
import type { UserAssignmentOption } from "./UserAssignmentPicker"
import type { UploadFeedbackState } from "./AttachmentUploadQueue"
import type { ActivityForm } from "./courseManagement.types"

type ActivityCreatorProps = Readonly<{
  tracks: Array<{ id: string; title: string }>
  availableUsers: UserAssignmentOption[]
  onCreate: (form: ActivityForm) => Promise<boolean>
}>

const EMPTY_ACTIVITY_FORM: ActivityForm = {
  trackId: "",
  title: "",
  type: "lesson",
  estimatedMinutes: "",
  order: "",
  visibility: "module",
  userIds: [],
  scheduleMode: "now",
  releaseAt: "",
  dueAt: "",
  closeAt: "",
  attachments: [],
  questions: [],
}

export function ActivityCreator({ tracks, availableUsers, onCreate }: ActivityCreatorProps) {
  const [form, setForm] = React.useState<ActivityForm>(EMPTY_ACTIVITY_FORM)
  const [localCreating, setLocalCreating] = React.useState(false)
  const [userSearch, setUserSearch] = React.useState("")
  const [uploadingIndices, setUploadingIndices] = React.useState<Record<number, boolean>>({})
  const [uploadFeedback, setUploadFeedback] = React.useState<Record<number, UploadFeedbackState>>({})
  const [uploadProgress, setUploadProgress] = React.useState<Record<number, number>>({})
  const uploadIntervalsRef = React.useRef<Record<number, ReturnType<typeof setInterval>>>({})
  const [validationErrors, setValidationErrors] = React.useState<ActivityValidationErrors>({})
  const [questionAudioUploading, setQuestionAudioUploading] = React.useState<Record<number, boolean>>({})

  const resetForm = React.useCallback(() => {
    setForm({ ...EMPTY_ACTIVITY_FORM, attachments: [], questions: [], userIds: [] })
    setUserSearch("")
    setUploadingIndices({})
    setUploadFeedback({})
    setUploadProgress({})
    setValidationErrors({})
    setQuestionAudioUploading({})
  }, [])

  React.useEffect(() => {
    const intervalStore = uploadIntervalsRef.current
    return () => {
      Object.values(intervalStore).forEach((intervalId) => clearInterval(intervalId))
    }
  }, [])

  const onSubmit = React.useCallback(async () => {
    const errors: ActivityValidationErrors = {}
    const estimated = Number(form.estimatedMinutes)
    if (!form.trackId.trim()) errors.trackId = "Selecione o modulo de destino."
    if (!form.title.trim()) errors.title = "Informe o titulo da atividade."
    if (!Number.isFinite(estimated) || estimated <= 0) {
      errors.estimatedMinutes = "Informe uma duração valida em minutos."
    }
    if (form.visibility === "users" && form.userIds.length === 0) {
      errors.users = "Selecione ao menos um aluno para visibilidade restrita."
    }
    const scheduleValidation = validateActivitySchedule({
      releaseAt: form.scheduleMode === "scheduled" ? form.releaseAt : null,
      dueAt: form.dueAt || null,
      closeAt: form.closeAt || null,
    })
    if (!scheduleValidation.ok) {
      errors.schedule = scheduleValidation.message
    }
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      toast.error("Revise os campos obrigatórios antes de salvar.")
      return
    }

    setLocalCreating(true)
    try {
      if (await onCreate(form)) resetForm()
    } finally {
      setLocalCreating(false)
    }
  }, [form, onCreate, resetForm])

  const addQuestion = React.useCallback(() => {
    setForm((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          id: `q-${Date.now()}`,
          type: "essay",
          prompt: "",
          options: [],
          correctAnswers: [],
          points: "10",
          required: true,
        },
      ],
    }))
  }, [])

  const removeQuestion = React.useCallback(async (index: number) => {
    const promptAudioUrl = form.questions[index]?.promptAudio?.url
    if (promptAudioUrl) await deleteMediaByUrl(promptAudioUrl)
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, questionIndex) => questionIndex !== index),
    }))
  }, [form.questions])

  const uploadQuestionAudio = React.useCallback(async (index: number, file: File) => {
    const previousUrl = form.questions[index]?.promptAudio?.url
    setQuestionAudioUploading((current) => ({ ...current, [index]: true }))
    try {
      const formData = new FormData()
      formData.append("file", file)
      const result = await uploadMedia(formData, "activity-question-audio")
      setForm((prev) => {
        if (!prev.questions[index]) return prev
        const next = [...prev.questions]
        next[index] = {
          ...next[index],
          promptAudio: { name: file.name, url: result.secure_url, type: "audio" },
        }
        return { ...prev, questions: next }
      })
      if (previousUrl && previousUrl !== result.secure_url) await deleteMediaByUrl(previousUrl)
      toast.success("Áudio da questão adicionado")
    } catch (error) {
      console.error("Question audio upload failed", error)
      toast.error("Erro ao adicionar áudio à questão")
    } finally {
      setQuestionAudioUploading((current) => ({ ...current, [index]: false }))
    }
  }, [form.questions])

  const removeQuestionAudio = React.useCallback(async (index: number) => {
    const url = form.questions[index]?.promptAudio?.url
    if (url) await deleteMediaByUrl(url)
    setForm((prev) => {
      if (!prev.questions[index]) return prev
      const next = [...prev.questions]
      const question = { ...next[index] }
      delete question.promptAudio
      next[index] = question
      return { ...prev, questions: next }
    })
  }, [form.questions])

  const startProgressSimulation = React.useCallback((index: number) => {
    clearInterval(uploadIntervalsRef.current[index])
    setUploadProgress((prev) => ({ ...prev, [index]: 9 }))
    uploadIntervalsRef.current[index] = setInterval(() => {
      setUploadProgress((prev) => {
        const current = prev[index] ?? 0
        if (current >= 88) return prev
        return { ...prev, [index]: Math.min(88, current + Math.round(Math.random() * 10) + 4) }
      })
    }, 180)
  }, [])

  const finishProgressSimulation = React.useCallback((index: number) => {
    clearInterval(uploadIntervalsRef.current[index])
    delete uploadIntervalsRef.current[index]
    setUploadProgress((prev) => ({ ...prev, [index]: 100 }))
  }, [])

  const uploadFileAtIndex = React.useCallback(async (index: number, file: File) => {
    const formData = new FormData()
    formData.append("file", file)
    setUploadingIndices((prev) => ({ ...prev, [index]: true }))
    setUploadFeedback((prev) => ({
      ...prev,
      [index]: { status: "uploading", message: `Enviando ${file.name}...` },
    }))
    startProgressSimulation(index)

    try {
      const result = await uploadMedia(formData, "activities")
      setForm((prev) => {
        if (!prev.attachments[index]) return prev
        const next = [...prev.attachments]
        next[index] = {
          ...next[index],
          type: inferMediaAttachmentType(file),
          url: result.secure_url,
          name: next[index].name || file.name,
        }
        return { ...prev, attachments: next }
      })
      finishProgressSimulation(index)
      setUploadFeedback((prev) => ({
        ...prev,
        [index]: { status: "success", message: "Upload concluído. Arquivo pronto para visualização." },
      }))
      toast.success(`Upload concluído: ${file.name}`)
    } catch (error) {
      clearInterval(uploadIntervalsRef.current[index])
      delete uploadIntervalsRef.current[index]
      setUploadProgress((prev) => ({ ...prev, [index]: 100 }))
      console.error("Upload failed", error)
      setUploadFeedback((prev) => ({
        ...prev,
        [index]: { status: "error", message: "Falha no upload. Tente novamente." },
      }))
      toast.error(`Falha no upload: ${file.name}`)
    } finally {
      setUploadingIndices((prev) => ({ ...prev, [index]: false }))
    }
  }, [finishProgressSimulation, startProgressSimulation])

  const removeAttachment = React.useCallback(async (index: number) => {
    const currentUrl = form.attachments[index]?.url?.trim()
    clearInterval(uploadIntervalsRef.current[index])
    delete uploadIntervalsRef.current[index]
    if (currentUrl) {
      try {
        await deleteMediaByUrl(currentUrl)
      } catch (error) {
        console.error("Attachment delete failed", error)
      }
    }

    setForm((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, attachmentIndex) => attachmentIndex !== index),
    }))
    setUploadingIndices((prev) => {
      const next = { ...prev }
      delete next[index]
      return next
    })
    setUploadFeedback((prev) => {
      const next = { ...prev }
      delete next[index]
      return next
    })
    setUploadProgress((prev) => {
      const next = { ...prev }
      delete next[index]
      return next
    })
  }, [form.attachments])

  const enqueueFiles = React.useCallback(async (files: File[]) => {
    if (!files.length) return
    const startIndex = form.attachments.length
    setForm((prev) => ({
      ...prev,
      attachments: [
        ...prev.attachments,
        ...files.map((file) => ({
          name: file.name,
          url: "",
          type: inferMediaAttachmentType(file),
        })),
      ],
    }))
    setUploadFeedback((prev) => {
      const next = { ...prev }
      files.forEach((file, offset) => {
        next[startIndex + offset] = { status: "uploading", message: `Preparando ${file.name}...` }
      })
      return next
    })
    setUploadProgress((prev) => {
      const next = { ...prev }
      files.forEach((_, offset) => {
        next[startIndex + offset] = 0
      })
      return next
    })

    await Promise.all(files.map((file, offset) => uploadFileAtIndex(startIndex + offset, file)))
  }, [form.attachments.length, uploadFileAtIndex])

  const handleCopyAttachmentLink = React.useCallback(async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      toast.success("Link do anexo copiado")
    } catch {
      toast.error("Nao foi possível copiar o link")
    }
  }, [])

  const toggleUserSelection = React.useCallback((uid: string) => {
    setForm((prev) => ({
      ...prev,
      userIds: prev.userIds.includes(uid)
        ? prev.userIds.filter((id) => id !== uid)
        : [...prev.userIds, uid],
    }))
    setValidationErrors((prev) => ({ ...prev, users: undefined }))
  }, [])

  const selectedUsers = React.useMemo(
    () => availableUsers.filter((user) => form.userIds.includes(user.uid)),
    [availableUsers, form.userIds]
  )

  const suggestedUsers = React.useMemo(() => {
    if (!userSearch.trim()) return []
    const search = userSearch.toLocaleLowerCase("pt-BR")
    return availableUsers
      .filter(
        (user) =>
          !form.userIds.includes(user.uid) &&
          (user.name?.toLocaleLowerCase("pt-BR").includes(search) ||
            user.email?.toLocaleLowerCase("pt-BR").includes(search))
      )
      .slice(0, 5)
  }, [availableUsers, form.userIds, userSearch])

  return (
    <ActivityCreationPanel
      showCreatePanel
      tracks={tracks}
      form={form}
      validationErrors={validationErrors}
      localCreating={localCreating}
      userSearch={userSearch}
      selectedUsers={selectedUsers}
      suggestedUsers={suggestedUsers}
      uploadingIndices={uploadingIndices}
      uploadFeedback={uploadFeedback}
      uploadProgress={uploadProgress}
      onUserSearchChange={setUserSearch}
      onToggleUser={toggleUserSelection}
      onFormChange={setForm}
      onValidationErrorClear={(key) => setValidationErrors((prev) => ({ ...prev, [key]: undefined }))}
      onAddQuestion={addQuestion}
      onRemoveQuestion={(index) => void removeQuestion(index)}
      questionAudioUploading={questionAudioUploading}
      onQuestionAudioFile={uploadQuestionAudio}
      onRemoveQuestionAudio={(index) => void removeQuestionAudio(index)}
      onAddFiles={enqueueFiles}
      onRetryUpload={uploadFileAtIndex}
      onRemoveAttachment={removeAttachment}
      onAttachmentTypeChange={(index, type) => {
        setForm((prev) => {
          const next = [...prev.attachments]
          next[index] = { ...next[index], type }
          return { ...prev, attachments: next }
        })
      }}
      onAttachmentNameChange={(index, name) => {
        setForm((prev) => {
          const next = [...prev.attachments]
          next[index] = { ...next[index], name }
          return { ...prev, attachments: next }
        })
      }}
      onCopyAttachmentLink={handleCopyAttachmentLink}
      onSubmit={onSubmit}
    />
  )
}
