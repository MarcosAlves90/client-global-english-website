"use client"

import * as React from "react"

import { useCourseManagement, ActivityForm } from "./CourseManagementContext"
import { ActivityCreationPanel, ActivityValidationErrors } from "./ActivityCreationPanel"
import { ActivityInsightsPanel } from "./ActivityInsightsPanel"
import { UploadFeedbackState } from "./AttachmentUploadQueue"
import { deleteImage, getPublicIdFromUrl, uploadImage } from "@/lib/cloudinary-actions"
import { toast } from "sonner"

type ActivityManagementProps = Readonly<{
    showCreatePanel: boolean
}>

export function ActivityManagement({ showCreatePanel }: ActivityManagementProps) {
    const {
        tracks,
        activities,
        activityResponses,
        availableUsers,
        loading,
        handleCreateActivity,
        handleDeleteActivity,
        handleDeleteActivityAttachment,
    } = useCourseManagement()

    const [form, setForm] = React.useState<ActivityForm>({
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

    const [localCreating, setLocalCreating] = React.useState(false)
    const [userSearch, setUserSearch] = React.useState("")
    const [uploadingIndices, setUploadingIndices] = React.useState<Record<number, boolean>>({})
    const [uploadFeedback, setUploadFeedback] = React.useState<Record<number, UploadFeedbackState>>({})
    const [uploadProgress, setUploadProgress] = React.useState<Record<number, number>>({})
    const uploadIntervalsRef = React.useRef<Record<number, ReturnType<typeof setInterval>>>({})
    const [validationErrors, setValidationErrors] = React.useState<ActivityValidationErrors>({})

    const resetForm = React.useCallback(() => {
        setForm({
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
        setUserSearch("")
        setUploadingIndices({})
        setUploadFeedback({})
        setUploadProgress({})
        setValidationErrors({})
    }, [])

    React.useEffect(() => {
        const intervalStore = uploadIntervalsRef.current
        return () => {
            Object.values(intervalStore).forEach((intervalId) => clearInterval(intervalId))
        }
    }, [])

    const inferAttachmentType = React.useCallback((file: File): ActivityForm["attachments"][number]["type"] => {
        if (file.type.startsWith("video/")) return "video"
        if (file.type.startsWith("audio/")) return "audio"
        return "pdf"
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
        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors)
            toast.error("Revise os campos obrigatórios antes de salvar.")
            return
        }

        setLocalCreating(true)
        const success = await handleCreateActivity(form)
        setLocalCreating(false)
        if (success) resetForm()
    }, [form, handleCreateActivity, resetForm])

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

    const removeQuestion = React.useCallback((index: number) => {
        setForm((prev) => ({
            ...prev,
            questions: prev.questions.filter((_, i) => i !== index),
        }))
    }, [])

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
        setUploadFeedback((prev) => ({ ...prev, [index]: { status: "uploading", message: `Enviando ${file.name}...` } }))
        startProgressSimulation(index)

        try {
            const result = await uploadImage(formData, "activities")
            setForm((prev) => {
                if (!prev.attachments[index]) return prev
                const next = [...prev.attachments]
                next[index] = {
                    ...next[index],
                    type: inferAttachmentType(file),
                    url: result.secure_url,
                    name: next[index].name || file.name,
                }
                return { ...prev, attachments: next }
            })
            finishProgressSimulation(index)
            setUploadFeedback((prev) => ({ ...prev, [index]: { status: "success", message: "Upload concluído. Arquivo pronto para visualização." } }))
            toast.success(`Upload concluído: ${file.name}`)
        } catch (error) {
            clearInterval(uploadIntervalsRef.current[index])
            delete uploadIntervalsRef.current[index]
            setUploadProgress((prev) => ({ ...prev, [index]: 100 }))
            console.error("Upload failed", error)
            setUploadFeedback((prev) => ({ ...prev, [index]: { status: "error", message: "Falha no upload. Tente novamente." } }))
            toast.error(`Falha no upload: ${file.name}`)
        } finally {
            setUploadingIndices((prev) => ({ ...prev, [index]: false }))
        }
    }, [finishProgressSimulation, inferAttachmentType, startProgressSimulation])

    const removeAttachment = React.useCallback(async (index: number) => {
        const currentUrl = form.attachments[index]?.url?.trim()
        clearInterval(uploadIntervalsRef.current[index])
        delete uploadIntervalsRef.current[index]
        if (currentUrl) {
            try {
                const publicId = await getPublicIdFromUrl(currentUrl)
                if (publicId) await deleteImage(publicId)
            } catch (error) {
                console.error("Attachment delete failed", error)
            }
        }

        setForm((prev) => ({ ...prev, attachments: prev.attachments.filter((_, i) => i !== index) }))
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
                    type: inferAttachmentType(file),
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
    }, [form.attachments.length, inferAttachmentType, uploadFileAtIndex])

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
            userIds: prev.userIds.includes(uid) ? prev.userIds.filter((id) => id !== uid) : [...prev.userIds, uid],
        }))
        setValidationErrors((prev) => ({ ...prev, users: undefined }))
    }, [])

    const selectedUsers = React.useMemo(() => {
        return availableUsers.filter((user) => form.userIds.includes(user.uid))
    }, [availableUsers, form.userIds])

    const suggestedUsers = React.useMemo(() => {
        if (!userSearch.trim()) return []
        const search = userSearch.toLowerCase()
        return availableUsers
            .filter((user) => !form.userIds.includes(user.uid) && (user.name?.toLowerCase().includes(search) || user.email?.toLowerCase().includes(search)))
            .slice(0, 5)
    }, [availableUsers, form.userIds, userSearch])

    return (
        <div className="grid gap-6 lg:grid-cols-[1.5fr,1fr]">
            <div className="flex flex-col gap-6">
                <ActivityCreationPanel
                    showCreatePanel={showCreatePanel}
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
                    onRemoveQuestion={removeQuestion}
                    onAddFiles={enqueueFiles}
                    onRetryUpload={uploadFileAtIndex}
                    onRemoveAttachment={removeAttachment}
                    onAttachmentTypeChange={(index, type) => {
                        setForm((p) => {
                            const next = [...p.attachments]
                            next[index] = { ...next[index], type }
                            return { ...p, attachments: next }
                        })
                    }}
                    onAttachmentNameChange={(index, name) => {
                        setForm((p) => {
                            const next = [...p.attachments]
                            next[index] = { ...next[index], name }
                            return { ...p, attachments: next }
                        })
                    }}
                    onCopyAttachmentLink={handleCopyAttachmentLink}
                    onSubmit={onSubmit}
                />
            </div>

            <ActivityInsightsPanel
                loading={loading}
                activities={activities}
                tracks={tracks}
                activityResponses={activityResponses}
                onDeleteActivity={handleDeleteActivity}
                onDeleteActivityAttachment={handleDeleteActivityAttachment}
                onCopyAttachmentLink={handleCopyAttachmentLink}
            />
        </div>
    )
}
