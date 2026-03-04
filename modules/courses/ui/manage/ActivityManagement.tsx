"use client"

import * as React from "react"
import {
    AlertCircle,
    ChevronDown,
    Copy,
    Eye,
    Plus,
    Target,
    Trash2,
    X,
    FileText,
    UploadCloud,
    GripVertical,
    CheckCircle2,
    Circle,
    Info,
    Users,
    Loader2,
    Sparkles,
    Link2,
    Video,
    FileAudio,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { useCourseManagement, ActivityForm } from "./CourseManagementContext"
import { ReleaseControls } from "./ReleaseControls"
import { ACTIVITY_TYPE_LABELS, ACTIVITY_TYPE_ICONS } from "./constants"
import { deleteImage, getPublicIdFromUrl, uploadImage } from "@/lib/cloudinary-actions"
import { MATERIAL_TYPE_LABELS } from "./constants"
import { toast } from "sonner"

type UploadFeedbackState = {
    status: "idle" | "uploading" | "success" | "error"
    message: string
}

type ActivityValidationErrors = {
    trackId?: string
    title?: string
    estimatedMinutes?: string
    users?: string
}

function reindexRecordByRemovedIndex<T>(record: Record<number, T>, removedIndex: number): Record<number, T> {
    const entries = Object.entries(record).flatMap(([key, value]) => {
        const numericKey = Number(key)
        if (numericKey === removedIndex) return []
        const adjustedKey = numericKey > removedIndex ? numericKey - 1 : numericKey
        return [[adjustedKey, value] as const]
    })
    return Object.fromEntries(entries)
}

export function ActivityManagement() {
    const {
        tracks,
        activities,
        availableUsers,
        loading,
        loadActivities,
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
    const [isDropZoneActive, setIsDropZoneActive] = React.useState(false)
    const filePickerRef = React.useRef<HTMLInputElement | null>(null)
    const uploadIntervalsRef = React.useRef<Record<number, ReturnType<typeof setInterval>>>({})
    const [validationErrors, setValidationErrors] = React.useState<ActivityValidationErrors>({})

    const resetForm = () => {
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
    }

    React.useEffect(() => {
        const intervalStore = uploadIntervalsRef.current
        return () => {
            Object.values(intervalStore).forEach((intervalId) => clearInterval(intervalId))
        }
    }, [])

    const onSubmit = async () => {
        const errors: ActivityValidationErrors = {}
        const estimated = Number(form.estimatedMinutes)
        if (!form.trackId.trim()) errors.trackId = "Selecione o modulo de destino."
        if (!form.title.trim()) errors.title = "Informe o titulo da atividade."
        if (!Number.isFinite(estimated) || estimated <= 0) {
            errors.estimatedMinutes = "Informe uma duracao valida em minutos."
        }
        if (form.visibility === "users" && form.userIds.length === 0) {
            errors.users = "Selecione ao menos um aluno para visibilidade restrita."
        }
        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors)
            toast.error("Revise os campos obrigatorios antes de salvar.")
            return
        }

        setLocalCreating(true)
        const success = await handleCreateActivity(form)
        setLocalCreating(false)
        if (success) {
            resetForm()
        }
    }

    const addQuestion = () => {
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
    }

    const removeQuestion = (index: number) => {
        setForm((prev) => ({
            ...prev,
            questions: prev.questions.filter((_, i) => i !== index),
        }))
    }

    const inferAttachmentType = (file: File): ActivityForm["attachments"][number]["type"] => {
        if (file.type.startsWith("video/")) return "video"
        if (file.type.startsWith("audio/")) return "audio"
        return "pdf"
    }

    const startProgressSimulation = (index: number) => {
        clearInterval(uploadIntervalsRef.current[index])
        setUploadProgress((prev) => ({ ...prev, [index]: 9 }))
        uploadIntervalsRef.current[index] = setInterval(() => {
            setUploadProgress((prev) => {
                const current = prev[index] ?? 0
                if (current >= 88) return prev
                return { ...prev, [index]: Math.min(88, current + Math.round(Math.random() * 10) + 4) }
            })
        }, 180)
    }

    const finishProgressSimulation = (index: number) => {
        clearInterval(uploadIntervalsRef.current[index])
        delete uploadIntervalsRef.current[index]
        setUploadProgress((prev) => ({ ...prev, [index]: 100 }))
    }

    const uploadFileAtIndex = async (index: number, file: File) => {
        const formData = new FormData()
        formData.append("file", file)
        setUploadingIndices((prev) => ({ ...prev, [index]: true }))
        setUploadFeedback((prev) => ({
            ...prev,
            [index]: { status: "uploading", message: `Enviando ${file.name}...` },
        }))
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
            setUploadFeedback((prev) => ({
                ...prev,
                [index]: { status: "success", message: "Upload concluido. Arquivo pronto para visualizacao." },
            }))
            toast.success(`Upload concluido: ${file.name}`)
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
    }

    const removeAttachment = async (index: number) => {
        const currentUrl = form.attachments[index]?.url?.trim()
        clearInterval(uploadIntervalsRef.current[index])
        delete uploadIntervalsRef.current[index]
        if (currentUrl) {
            try {
                const publicId = await getPublicIdFromUrl(currentUrl)
                if (publicId) {
                    await deleteImage(publicId)
                }
            } catch (error) {
                console.error("Attachment delete failed", error)
            }
        }

        setForm((prev) => ({
            ...prev,
            attachments: prev.attachments.filter((_, i) => i !== index),
        }))
        setUploadingIndices((prev) => reindexRecordByRemovedIndex(prev, index))
        setUploadFeedback((prev) => reindexRecordByRemovedIndex(prev, index))
        setUploadProgress((prev) => reindexRecordByRemovedIndex(prev, index))
    }

    const handleFileUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        await uploadFileAtIndex(index, file)
        e.target.value = ""
    }

    const enqueueFiles = async (files: File[]) => {
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
    }

    const handleDropZoneDrop = async (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        setIsDropZoneActive(false)
        const files = Array.from(e.dataTransfer.files ?? [])
        await enqueueFiles(files)
    }

    const handleFilePickerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? [])
        await enqueueFiles(files)
        e.target.value = ""
    }

    const handleCopyAttachmentLink = async (url: string) => {
        try {
            await navigator.clipboard.writeText(url)
            toast.success("Link do anexo copiado")
        } catch {
            toast.error("Nao foi possivel copiar o link")
        }
    }

    const toggleUserSelection = (uid: string) => {
        setForm((prev) => ({
            ...prev,
            userIds: prev.userIds.includes(uid)
                ? prev.userIds.filter((id) => id !== uid)
                : [...prev.userIds, uid],
        }))
        setValidationErrors((prev) => ({ ...prev, users: undefined }))
    }

    const selectedUsers = React.useMemo(() => {
        return availableUsers.filter((user) => form.userIds.includes(user.uid))
    }, [availableUsers, form.userIds])

    const suggestedUsers = React.useMemo(() => {
        if (!userSearch.trim()) return []
        const search = userSearch.toLowerCase()
        return availableUsers
            .filter(
                (user) =>
                    !form.userIds.includes(user.uid) &&
                    (user.name?.toLowerCase().includes(search) ||
                        user.email?.toLowerCase().includes(search))
            )
            .slice(0, 5)
    }, [availableUsers, form.userIds, userSearch])



    return (
        <div className="grid gap-6 lg:grid-cols-[1.5fr,1fr]">
            {/* Creation and Form Card */}
            <div className="flex flex-col gap-6">
                <Card className="border-primary/20 bg-card/40 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-base font-bold">Estrutura da Atividade</CardTitle>
                        <p className="text-xs text-muted-foreground leading-relaxed">Defina o tipo de exercício, tempo estimado e critérios.</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label required className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60">Módulo de Destino</Label>
                                <select
                                    className={`bg-background/50 text-foreground h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs outline-none focus:border-primary/30 ${
                                        validationErrors.trackId ? "border-destructive/60" : "border-primary/20"
                                    }`}
                                    value={form.trackId}
                                    onChange={(e) => {
                                        const value = e.target.value
                                        setForm((p) => ({ ...p, trackId: value }))
                                        if (value.trim()) {
                                            setValidationErrors((prev) => ({ ...prev, trackId: undefined }))
                                        }
                                    }}
                                >
                                    <option value="">Selecione um módulo</option>
                                    {tracks.map((track) => (
                                        <option key={track.id} value={track.id}>{track.title}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label required className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60">Título</Label>
                                <Input
                                    placeholder="Ex.: Simulação de Reunião"
                                    value={form.title}
                                    onChange={(e) => {
                                        const value = e.target.value
                                        setForm((p) => ({ ...p, title: value }))
                                        if (value.trim()) {
                                            setValidationErrors((prev) => ({ ...prev, title: undefined }))
                                        }
                                    }}
                                    className={`bg-background/50 ${validationErrors.title ? "border-destructive/60" : "border-primary/20"}`}
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-3">
                            <div className="space-y-2">
                                <Label required className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60">Categoria</Label>
                                <select
                                    className="bg-background/50 text-foreground border-primary/20 h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs outline-none focus:border-primary/30"
                                    value={form.type}
                                    onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as ActivityForm["type"] }))}
                                >
                                    {Object.entries(ACTIVITY_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label required className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60">Duração (Min)</Label>
                                <Input
                                    type="number"
                                    placeholder="Ex.: 45"
                                    value={form.estimatedMinutes}
                                    onChange={(e) => {
                                        const value = e.target.value
                                        setForm((p) => ({ ...p, estimatedMinutes: value }))
                                        if (Number(value) > 0) {
                                            setValidationErrors((prev) => ({ ...prev, estimatedMinutes: undefined }))
                                        }
                                    }}
                                    className={`bg-background/50 ${validationErrors.estimatedMinutes ? "border-destructive/60" : "border-primary/20"}`}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60">Ordem na Trilha</Label>
                                <Input
                                    type="number"
                                    placeholder="Ex.: 2"
                                    value={form.order}
                                    onChange={(e) => setForm((p) => ({ ...p, order: e.target.value }))}
                                    className="bg-background/50 border-primary/20"
                                />
                            </div>
                        </div>

                        <div className="space-y-3 pt-4 border-t border-primary/5">
                            <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60">Anexos</Label>
                                <p className="text-[10px] font-medium text-muted-foreground/70">Use a area abaixo para clicar ou arrastar arquivos</p>
                            </div>

                            <input
                                ref={filePickerRef}
                                type="file"
                                multiple
                                className="hidden"
                                onChange={handleFilePickerChange}
                            />

                            <div
                                role="button"
                                tabIndex={0}
                                onDragOver={(e) => {
                                    e.preventDefault()
                                    setIsDropZoneActive(true)
                                }}
                                onDragLeave={() => setIsDropZoneActive(false)}
                                onDrop={(e) => void handleDropZoneDrop(e)}
                                onClick={() => filePickerRef.current?.click()}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault()
                                        filePickerRef.current?.click()
                                    }
                                }}
                                className={`rounded-2xl border border-dashed p-5 transition-all cursor-pointer ${
                                    isDropZoneActive
                                        ? "border-primary/50 bg-primary/10"
                                        : "border-primary/20 bg-linear-to-br from-primary/5 via-background/40 to-background/10 hover:border-primary/40"
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                        <UploadCloud className="size-5" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold uppercase tracking-wider">Arraste e solte arquivos aqui</p>
                                        <p className="text-xs text-muted-foreground">Ou clique para selecionar. Upload automatico com feedback em tempo real.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                {form.attachments.length === 0 ? (
                                    <div className="rounded-xl border border-dashed border-primary/10 p-4 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
                                        Nenhum anexo na fila
                                    </div>
                                ) : (
                                    form.attachments.map((att, idx) => {
                                        const feedback = uploadFeedback[idx]
                                        const progress = uploadProgress[idx] ?? 0
                                        const statusClass =
                                            feedback?.status === "error"
                                                ? "text-destructive"
                                                : feedback?.status === "success"
                                                    ? "text-emerald-600"
                                                    : "text-muted-foreground"

                                        const AttachmentTypeIcon =
                                            att.type === "video" ? Video : att.type === "audio" ? FileAudio : att.type === "link" ? Link2 : FileText

                                        return (
                                            <div key={idx} className="rounded-xl border border-primary/15 bg-background/70 p-3 space-y-3 overflow-hidden">
                                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                                    <div className="flex min-w-0 flex-1 items-start gap-2">
                                                        <div className="mt-0.5 size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                                            <AttachmentTypeIcon className="size-4" />
                                                        </div>
                                                        <div className="min-w-0 flex-1 space-y-2">
                                                            <div className="grid gap-2 md:grid-cols-[120px,1fr]">
                                                                <select
                                                                    className="bg-background/60 text-foreground border-primary/20 h-8 w-full rounded-md border px-2 py-0 text-[10px] uppercase font-bold tracking-tight outline-none"
                                                                    value={att.type}
                                                                    onChange={(e) =>
                                                                        setForm((p) => {
                                                                            const next = [...p.attachments]
                                                                            next[idx] = { ...next[idx], type: e.target.value as typeof next[number]["type"] }
                                                                            return { ...p, attachments: next }
                                                                        })
                                                                    }
                                                                >
                                                                    {Object.entries(MATERIAL_TYPE_LABELS)
                                                                        .filter(([key]) => key !== "link")
                                                                        .map(([key, label]) => (
                                                                            <option key={key} value={key}>
                                                                                {label}
                                                                            </option>
                                                                        ))}
                                                                </select>
                                                                <Input
                                                                    placeholder="Nome amigavel do anexo"
                                                                    value={att.name}
                                                                    onChange={(e) =>
                                                                        setForm((p) => {
                                                                            const next = [...p.attachments]
                                                                            next[idx] = { ...next[idx], name: e.target.value }
                                                                            return { ...p, attachments: next }
                                                                        })
                                                                    }
                                                                    className="h-8 text-xs bg-background/60 border-primary/20"
                                                                />
                                                            </div>
                                                            <div className="h-1.5 w-full rounded-full bg-primary/10 overflow-hidden">
                                                                <div
                                                                    className={`h-full transition-all duration-300 ${
                                                                        feedback?.status === "error"
                                                                            ? "bg-destructive/80"
                                                                            : feedback?.status === "success"
                                                                                ? "bg-emerald-500"
                                                                                : "bg-primary"
                                                                    }`}
                                                                    style={{ width: `${progress}%` }}
                                                                />
                                                            </div>
                                                            <p className={`text-[11px] inline-flex items-center gap-1 ${statusClass}`}>
                                                                {feedback?.status === "uploading" ? (
                                                                    <Loader2 className="size-3 animate-spin" />
                                                                ) : feedback?.status === "success" ? (
                                                                    <CheckCircle2 className="size-3" />
                                                                ) : feedback?.status === "error" ? (
                                                                    <AlertCircle className="size-3" />
                                                                ) : (
                                                                    <Sparkles className="size-3" />
                                                                )}
                                                                {feedback?.message ?? (att.url ? "Anexo pronto para visualizacao" : "Aguardando upload")}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1 self-end sm:self-auto">
                                                        <input
                                                            type="file"
                                                            id={`activity-file-upload-${idx}`}
                                                            className="hidden"
                                                            onChange={(e) => void handleFileUpload(idx, e)}
                                                        />
                                                        <Button
                                                            variant="ghost"
                                                            size="icon-xs"
                                                            type="button"
                                                            disabled={uploadingIndices[idx]}
                                                            onClick={() => document.getElementById(`activity-file-upload-${idx}`)?.click()}
                                                            aria-label="Reenviar arquivo"
                                                        >
                                                            {uploadingIndices[idx] ? <Loader2 className="size-3 animate-spin" /> : <UploadCloud className="size-3" />}
                                                        </Button>
                                                        {att.url ? (
                                                            <a
                                                                href={att.url}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="inline-flex size-6 items-center justify-center rounded-md border border-primary/20 text-primary hover:bg-primary/10"
                                                                aria-label="Visualizar anexo"
                                                            >
                                                                <Eye className="size-3" />
                                                            </a>
                                                        ) : null}
                                                        <Button
                                                            variant="ghost"
                                                            size="icon-xs"
                                                            type="button"
                                                            onClick={() => void removeAttachment(idx)}
                                                            className="text-destructive/60 hover:text-destructive"
                                                            aria-label="Excluir anexo"
                                                        >
                                                            <Trash2 className="size-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        </div>

                        <div className="space-y-3 pt-4 border-t border-primary/5">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60">Questões e Critérios</Label>
                                <Button variant="ghost" size="xs" onClick={addQuestion} className="text-[10px] font-bold uppercase tracking-widest text-primary">
                                    <Plus className="mr-1 size-3" /> Adicionar Questão
                                </Button>
                            </div>

                            <div className="space-y-4">
                                {form.questions.length === 0 ? (
                                    <div className="rounded-xl border border-dashed border-primary/20 p-12 text-center transition-colors hover:border-primary/20">
                                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/5 mb-4">
                                            <FileText className="h-6 w-6 text-primary/40" />
                                        </div>
                                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/40">Nenhuma questão definida</p>
                                        <p className="mt-1 text-xs text-muted-foreground/30">Adicione questões para estruturar sua atividade</p>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={addQuestion}
                                            className="mt-4 border-primary/20 text-[10px] font-bold uppercase tracking-widest"
                                        >
                                            <Plus className="mr-2 h-3 w-3" /> Criar Primeira Questão
                                        </Button>
                                    </div>
                                ) : (
                                    form.questions.map((q, qIdx) => (
                                        <Card key={q.id} className="group py-0 rounded gap-0 relative border-primary/20 bg-background/30 backdrop-blur-sm transition-all hover:border-primary/30 overflow-hidden shadow-sm">
                                            <div className="absolute top-0 left-0 h-full w-1 bg-primary/40 group-hover:bg-primary transition-colors" />

                                            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-black text-primary">
                                                        {qIdx + 1}
                                                    </div>
                                                    <Badge variant="outline" className="h-5 border-primary/20 bg-primary/5 px-1.5 text-[9px] font-bold uppercase tracking-wider text-primary">
                                                        {q.type === "essay" ? "Dissertativa" :
                                                            q.type === "single_choice" ? "Múltipla Escolha" :
                                                                q.type === "multiple_choice" ? "Seleção Múltipla" :
                                                                    q.type === "true_false" ? "Verdadeiro/Falso" : "Curta"}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 text-muted-foreground/40 hover:text-primary"
                                                        title="Mover para cima"
                                                    >
                                                        <GripVertical className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => removeQuestion(qIdx)}
                                                        className="h-7 w-7 text-muted-foreground/40 hover:text-destructive"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </CardHeader>

                                            <CardContent className="space-y-4 p-4 pt-2 pb-5">
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Enunciado da Questão</Label>
                                                    <textarea
                                                        className="min-h-20 w-full rounded-lg border border-primary/20 bg-background/50 p-3 text-sm transition-focus outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/20"
                                                        placeholder="Digite a pergunta de forma clara e objetiva..."
                                                        value={q.prompt}
                                                        onChange={(e) => setForm(p => {
                                                            const next = [...p.questions];
                                                            next[qIdx] = { ...next[qIdx], prompt: e.target.value };
                                                            return { ...p, questions: next };
                                                        })}
                                                    />
                                                </div>

                                                <div className="grid gap-4 sm:grid-cols-2">
                                                    <div className="space-y-1.5">
                                                        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Formato de Resposta</Label>
                                                        <select
                                                            className="h-9 w-full rounded-lg border border-primary/20 bg-background/50 px-3 text-xs font-medium outline-none focus:border-primary/30"
                                                            value={q.type}
                                                            onChange={(e) => setForm(p => {
                                                                const next = [...p.questions];
                                                                next[qIdx] = { ...next[qIdx], type: e.target.value as ActivityForm["questions"][number]["type"] };
                                                                return { ...p, questions: next };
                                                            })}
                                                        >
                                                            <option value="essay">📝 Resposta Dissertativa (Manual)</option>
                                                            <option value="single_choice">🔘 Escolha Única (Automatic)</option>
                                                            <option value="multiple_choice">☑️ Múltipla Escolha (Automatic)</option>
                                                            <option value="true_false">⚖️ Verdadeiro ou Falso</option>
                                                        </select>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 flex items-center gap-1.5">
                                                            Pontuação
                                                            <TooltipProvider>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Info className="h-3 w-3 text-muted-foreground/40" />
                                                                    </TooltipTrigger>
                                                                    <TooltipContent className="text-[10px]">Peso desta questão no cálculo da nota final</TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                        </Label>
                                                        <div className="relative">
                                                            <Input
                                                                type="number"
                                                                value={q.points}
                                                                onChange={(e) => setForm(p => {
                                                                    const next = [...p.questions];
                                                                    next[qIdx] = { ...next[qIdx], points: e.target.value };
                                                                    return { ...p, questions: next };
                                                                })}
                                                                className="h-9 border-primary/20 bg-background/50 pl-8 text-xs font-bold"
                                                            />
                                                            <Target className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground/30" />
                                                        </div>
                                                    </div>
                                                </div>

                                                {(q.type === "single_choice" || q.type === "multiple_choice" || q.type === "true_false") && (
                                                    <div className="mt-4 rounded-xl border border-primary/5 bg-primary/5 p-4 space-y-3">
                                                        <div className="flex items-center justify-between">
                                                            <Label className="text-[10px] font-bold uppercase tracking-widest text-primary/70">Opções e Gabarito</Label>
                                                            {q.type !== "true_false" && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="xs"
                                                                    onClick={() => setForm(p => {
                                                                        const next = [...p.questions];
                                                                        next[qIdx] = { ...next[qIdx], options: [...next[qIdx].options, ""] };
                                                                        return { ...p, questions: next };
                                                                    })}
                                                                    className="h-6 text-[9px] font-bold uppercase tracking-widest text-primary hover:bg-primary/10"
                                                                >
                                                                    <Plus className="mr-1 h-3 w-3" /> Adicionar Opção
                                                                </Button>
                                                            )}
                                                        </div>

                                                        <div className="space-y-2">
                                                            {(q.type === "true_false" ? ["Verdadeiro", "Falso"] : (q.options.length ? q.options : [""])).map((opt, oIdx) => {
                                                                const isCorrect = q.correctAnswers.includes(opt);
                                                                return (
                                                                    <div key={oIdx} className="group/opt flex items-center gap-2">
                                                                        <button
                                                                            onClick={() => setForm(p => {
                                                                                const next = [...p.questions];
                                                                                let corrected = [...next[qIdx].correctAnswers];
                                                                                if (q.type === "single_choice" || q.type === "true_false") {
                                                                                    corrected = [opt];
                                                                                } else {
                                                                                    corrected = isCorrect ? corrected.filter(c => c !== opt) : [...corrected, opt];
                                                                                }
                                                                                next[qIdx] = { ...next[qIdx], correctAnswers: corrected };
                                                                                return { ...p, questions: next };
                                                                            })}
                                                                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-all ${isCorrect
                                                                                    ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-500 shadow-sm shadow-emerald-500/20"
                                                                                    : "border-primary/20 bg-background/50 text-muted-foreground/30 hover:border-emerald-500/30 hover:text-emerald-500/50"
                                                                                }`}
                                                                        >
                                                                            {isCorrect ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                                                                        </button>

                                                                        <div className="relative flex-1">
                                                                            <Input
                                                                                placeholder={`Texto da opção ${oIdx + 1}`}
                                                                                value={opt}
                                                                                readOnly={q.type === "true_false"}
                                                                                onChange={(e) => setForm(p => {
                                                                                    const next = [...p.questions];
                                                                                    const opts = [...next[qIdx].options];
                                                                                    opts[oIdx] = e.target.value;
                                                                                    next[qIdx] = { ...next[qIdx], options: opts };
                                                                                    return { ...p, questions: next };
                                                                                })}
                                                                                className={`h-8 pr-10 text-xs transition-all ${isCorrect ? "border-emerald-500/20 bg-emerald-500/5 font-medium" : "border-primary/5 bg-background/50"
                                                                                    }`}
                                                                            />
                                                                            {q.type !== "true_false" && (
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="icon"
                                                                                    onClick={() => setForm(p => {
                                                                                        const next = [...p.questions];
                                                                                        const opts = next[qIdx].options.filter((_, idx) => idx !== oIdx);
                                                                                        next[qIdx] = { ...next[qIdx], options: opts };
                                                                                        return { ...p, questions: next };
                                                                                    })}
                                                                                    className="absolute right-1 top-1 h-6 w-6 text-muted-foreground/20 hover:text-destructive opacity-0 group-hover/opt:opacity-100 transition-opacity"
                                                                                >
                                                                                    <X className="h-3 w-3" />
                                                                                </Button>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>

                                                        {(q.type === "single_choice" || q.type === "multiple_choice" || q.type === "true_false") && (
                                                            <p className="text-[9px] font-medium text-emerald-500/60 flex items-center gap-1 mt-2">
                                                                <CheckCircle2 className="h-3 w-3" /> Clique no círculo para definir as respostas corretas.
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-primary/20 bg-card/40 backdrop-blur-sm">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-base font-bold">Configurações de Acesso</CardTitle>
                        <p className="text-xs text-muted-foreground leading-relaxed">Defina quem e quando poderá acessar esta atividade.</p>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <ReleaseControls
                            visibility={form.visibility}
                            onVisibilityChange={(value) => {
                                setForm((p) => ({ ...p, visibility: value }))
                                if (value !== "users") {
                                    setValidationErrors((prev) => ({ ...prev, users: undefined }))
                                }
                            }}
                            scheduleMode={form.scheduleMode}
                            onScheduleModeChange={(mode) => setForm((p) => ({ ...p, scheduleMode: mode }))}
                            releaseAt={form.releaseAt}
                            onReleaseAtChange={(value) => setForm((p) => ({ ...p, releaseAt: value }))}
                        >
                            {form.visibility === "users" && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between rounded-lg border border-primary/15 bg-primary/5 px-2 py-1.5">
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-primary/80">Acesso Restrito</p>
                                            <p className="text-[11px] text-muted-foreground">Somente alunos selecionados poderao visualizar.</p>
                                        </div>
                                        <span className="text-[10px] font-bold text-primary px-2 py-0.5 rounded-full bg-primary/10">{form.userIds.length} selecionados</span>
                                    </div>
                                    <div className="relative">
                                        <Input
                                            placeholder="Buscar por nome ou email..."
                                            value={userSearch}
                                            onChange={(e) => setUserSearch(e.target.value)}
                                            className="bg-background border-primary/20 text-xs h-9 pl-9"
                                        />
                                        <Users className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/40" />
                                    </div>
                                    <div className="rounded-lg border border-primary/10 bg-background/70 p-2">
                                        <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">Selecionados</p>
                                        <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto pr-1 custom-scrollbar">
                                            {selectedUsers.length === 0 ? (
                                                <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/40 text-center w-full py-3 bg-primary/5 rounded-lg">Nenhum aluno selecionado</p>
                                            ) : (
                                                selectedUsers.map((u) => (
                                                    <Badge key={u.uid} variant="secondary" className="flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                                                        <span className="text-[10px] font-bold">{u.name}</span>
                                                        <button type="button" onClick={() => toggleUserSelection(u.uid)} className="hover:text-destructive transition-colors">
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    </Badge>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                    {suggestedUsers.length > 0 && (
                                        <div className="space-y-1 rounded-lg border border-primary/10 bg-background/70 p-2">
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">Sugestoes</p>
                                            {suggestedUsers.map((u) => (
                                                <button
                                                    key={u.uid}
                                                    type="button"
                                                    onClick={() => toggleUserSelection(u.uid)}
                                                    className="w-full text-left text-xs p-2 hover:bg-primary/5 rounded-md border border-transparent hover:border-primary/20 flex justify-between items-center group transition-colors"
                                                >
                                                    <span className="font-medium text-muted-foreground group-hover:text-foreground">{u.name}</span>
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                                        <Plus className="size-3" /> Adicionar
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </ReleaseControls>

                        <div className="pt-2 flex flex-col gap-3">
                            {Object.values(validationErrors).some(Boolean) ? (
                                <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-2 text-xs text-destructive">
                                    {Object.values(validationErrors)
                                        .filter((message): message is string => Boolean(message))
                                        .map((message, idx) => (
                                            <p key={`${message}-${idx}`}>{message}</p>
                                        ))}
                                </div>
                            ) : null}
                            <Button
                                onClick={onSubmit}
                                disabled={localCreating}
                                className="w-full h-10 bg-primary text-primary-foreground font-bold uppercase tracking-[0.2em] text-[11px] shadow-md shadow-primary/20 hover:shadow-primary/30 transition-all"
                            >
                                {localCreating ? "Salvando..." : (
                                    <>
                                        <CheckCircle2 className="mr-2 h-4 w-4" /> Salvar Atividade
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* List Card */}
            <Card className="border-primary/20 bg-card/20 backdrop-blur-sm h-fit overflow-hidden lg:sticky lg:top-6">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex flex-col">
                        <CardTitle className="text-base font-bold">Banco de Atividades</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                            <Target className="size-3 text-primary/40" />
                            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{activities.length} exercícios</span>
                        </div>
                    </div>
                    <Button variant="ghost" size="xs" onClick={() => void loadActivities(true)} disabled={loading.activities} className="text-[10px] font-bold uppercase tracking-widest">Atualizar</Button>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {loading.activities ? (
                            <div className="h-32 flex items-center justify-center text-muted-foreground animate-pulse text-[10px] uppercase font-bold tracking-[0.3em]">Sincronizando...</div>
                        ) : tracks.length === 0 || activities.length === 0 ? (
                            <p className="text-[10px] text-muted-foreground/40 text-center py-12 font-bold uppercase tracking-widest">Aguardando novos desafios...</p>
                        ) : (
                            tracks.map(track => {
                                const trackActivities = activities.filter(a => a.trackId === track.id)
                                if (!trackActivities.length) return null
                                return (
                                    <div key={track.id} className="space-y-3">
                                        <p className="break-words text-[10px] font-bold uppercase tracking-[0.2em] text-blue-500/60 border-b border-blue-500/10 pb-1 mb-3">{track.title}</p>
                                        {trackActivities.map((a) => {
                                            const Icon = ACTIVITY_TYPE_ICONS[a.type as keyof typeof ACTIVITY_TYPE_ICONS] || FileText
                                            const questions = Array.isArray(a.questions) ? a.questions : []
                                            return (
                                                <Collapsible key={a.id} className="overflow-hidden rounded-2xl border border-primary/10 bg-background/60 p-3 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
                                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                                        <div className="flex min-w-0 flex-1 items-start gap-3">
                                                            <div className="size-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                                                <Icon className="size-4" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-xs font-bold tracking-tight break-words">{a.title}</p>
                                                                <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                                                                    <span className="rounded-full bg-primary/10 px-2 py-0.5 font-semibold uppercase text-primary">
                                                                        {ACTIVITY_TYPE_LABELS[a.type as keyof typeof ACTIVITY_TYPE_LABELS]}
                                                                    </span>
                                                                    <span>{a.estimatedMinutes || 0} min</span>
                                                                    <span>{a.attachments?.length || 0} anexo(s)</span>
                                                                    <span>{questions.length} questao(oes)</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1 self-end sm:self-auto">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon-xs"
                                                                onClick={() => handleDeleteActivity(a)}
                                                                className="text-destructive/60 hover:text-destructive"
                                                                aria-label="Excluir atividade"
                                                            >
                                                                <X className="size-3" />
                                                            </Button>
                                                            <CollapsibleTrigger asChild>
                                                                <Button variant="ghost" size="icon-xs" type="button" aria-label="Expandir atividade" className="group">
                                                                    <ChevronDown className="size-3 transition-transform group-data-[state=open]:rotate-180" />
                                                                </Button>
                                                            </CollapsibleTrigger>
                                                        </div>
                                                    </div>

                                                    <CollapsibleContent className="mt-3 space-y-3">
                                                        {questions.length > 0 ? (
                                                            <div className="rounded-xl border border-primary/10 bg-background/70 p-2 space-y-2">
                                                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                                                                    Questoes da Atividade
                                                                </p>
                                                                {questions.map((q, idx) => (
                                                                    <div key={q.id || `${a.id}-q-${idx}`} className="rounded-lg border border-primary/10 bg-background/60 p-2">
                                                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                                                            <p className="text-[11px] font-semibold">Q{idx + 1}</p>
                                                                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                                                                <span className="rounded-full bg-primary/10 px-2 py-0.5 uppercase font-semibold text-primary">
                                                                                    {q.type?.replace("_", " ") || "questao"}
                                                                                </span>
                                                                                <span>{q.points ?? 0} pts</span>
                                                                            </div>
                                                                        </div>
                                                                        <p className="mt-1 break-words text-xs text-foreground/90">{q.prompt || "Sem enunciado"}</p>
                                                                        {(q.options?.length ?? 0) > 0 ? (
                                                                            <ul className="mt-2 space-y-1">
                                                                                {(q.options ?? []).map((option, optionIdx) => {
                                                                                    const isCorrect = (q.correctAnswers ?? []).includes(option)
                                                                                    return (
                                                                                        <li
                                                                                            key={`${a.id}-${idx}-opt-${optionIdx}`}
                                                                                            className={`break-words rounded-md px-2 py-1 text-[11px] ${isCorrect
                                                                                                ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-700"
                                                                                                : "bg-primary/5 text-muted-foreground"
                                                                                                }`}
                                                                                        >
                                                                                            {option || `Opcao ${optionIdx + 1}`}
                                                                                        </li>
                                                                                    )
                                                                                })}
                                                                            </ul>
                                                                        ) : null}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <p className="text-[10px] text-muted-foreground/60">Sem questoes cadastradas nesta atividade.</p>
                                                        )}

                                                        {(a.attachments?.length ?? 0) > 0 ? (
                                                            <div className="grid gap-2">
                                                                {(a.attachments ?? []).map((attachment, idx) => (
                                                                    <div key={`${a.id}-${idx}`} className="rounded-lg border border-primary/10 bg-primary/5 px-2 py-1.5">
                                                                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                                                            <p className="min-w-0 break-all text-[11px] font-medium">{attachment.name || `Anexo ${idx + 1}`}</p>
                                                                            <div className="flex items-center gap-1 self-end sm:self-auto">
                                                                                {attachment.url ? (
                                                                                    <>
                                                                                        <a
                                                                                            href={attachment.url}
                                                                                            target="_blank"
                                                                                            rel="noreferrer"
                                                                                            className="inline-flex size-6 items-center justify-center rounded-md border border-primary/20 text-primary hover:bg-primary/10"
                                                                                            aria-label={`Abrir anexo ${attachment.name || idx + 1}`}
                                                                                        >
                                                                                            <Eye className="size-3" />
                                                                                        </a>
                                                                                        <Button
                                                                                            variant="ghost"
                                                                                            size="icon-xs"
                                                                                            type="button"
                                                                                            onClick={() => void handleCopyAttachmentLink(attachment.url)}
                                                                                            aria-label={`Copiar link ${attachment.name || idx + 1}`}
                                                                                        >
                                                                                            <Copy className="size-3" />
                                                                                        </Button>
                                                                                    </>
                                                                                ) : null}
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="icon-xs"
                                                                                    type="button"
                                                                                    onClick={() => void handleDeleteActivityAttachment(a.id, attachment.url)}
                                                                                    className="text-destructive/60 hover:text-destructive"
                                                                                    aria-label={`Excluir anexo ${attachment.name || idx + 1}`}
                                                                                >
                                                                                    <Trash2 className="size-3" />
                                                                                </Button>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <p className="text-[10px] text-muted-foreground/60">Sem anexos nesta atividade.</p>
                                                        )}
                                                    </CollapsibleContent>
                                                </Collapsible>
                                            )
                                        })}
                                    </div>
                                )
                            })
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}


