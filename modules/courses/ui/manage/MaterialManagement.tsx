"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import {
    AlertCircle,
    ChevronDown,
    CheckCircle2,
    Copy,
    Eye,
    FileText,
    Link2,
    Loader2,
    Plus,
    Sparkles,
    Trash2,
    UploadCloud,
    Video,
    FileAudio,
    Users2,
    X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCourseManagement, MaterialForm } from "./CourseManagementContext"
import { ReleaseControls } from "./ReleaseControls"
import { MATERIAL_TYPE_LABELS, MATERIAL_TYPE_ICONS } from "./constants"
import { deleteImage, getPublicIdFromUrl, uploadImage } from "@/lib/cloudinary-actions"
import { toast } from "sonner"

const MarkdownEditor = dynamic(() => import("@uiw/react-md-editor"), {
    ssr: false,
})
const MarkdownPreview = dynamic(() => import("@uiw/react-markdown-preview"), {
    ssr: false,
})

type UploadFeedbackState = {
    status: "idle" | "uploading" | "success" | "error"
    message: string
}

type MaterialValidationErrors = {
    trackId?: string
    title?: string
    content?: string
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

type MaterialManagementProps = {
    showCreatePanel: boolean
}

export function MaterialManagement({ showCreatePanel }: MaterialManagementProps) {
    const {
        tracks,
        materials,
        availableUsers,
        loading,
        loadMaterials,
        handleCreateMaterial,
        handleUpdateMaterial,
        handleDeleteMaterial,
        handleDeleteMaterialAttachment,
    } = useCourseManagement()

    const [form, setForm] = React.useState<MaterialForm>({
        trackId: "",
        title: "",
        visibility: "module",
        userIds: [],
        scheduleMode: "now",
        releaseAt: "",
        markdown: "",
        attachments: [],
    })

    const [localCreating, setLocalCreating] = React.useState(false)
    const [userSearch, setUserSearch] = React.useState("")
    const [uploadingIndices, setUploadingIndices] = React.useState<Record<number, boolean>>({})
    const [uploadFeedback, setUploadFeedback] = React.useState<Record<number, UploadFeedbackState>>({})
    const [uploadProgress, setUploadProgress] = React.useState<Record<number, number>>({})
    const [isDropZoneActive, setIsDropZoneActive] = React.useState(false)
    const filePickerRef = React.useRef<HTMLInputElement | null>(null)
    const uploadIntervalsRef = React.useRef<Record<number, ReturnType<typeof setInterval>>>({})
    const [editingMaterialId, setEditingMaterialId] = React.useState<string | null>(null)
    const [editingTitle, setEditingTitle] = React.useState("")
    const [editingMarkdown, setEditingMarkdown] = React.useState("")
    const [localUpdating, setLocalUpdating] = React.useState(false)
    const [validationErrors, setValidationErrors] = React.useState<MaterialValidationErrors>({})

    const resetForm = () => {
        setForm({
            trackId: "",
            title: "",
            visibility: "module",
            userIds: [],
            scheduleMode: "now",
            releaseAt: "",
            markdown: "",
            attachments: [],
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
        const errors: MaterialValidationErrors = {}
        if (!form.trackId.trim()) errors.trackId = "Selecione o modulo de destino."
        if (!form.title.trim()) errors.title = "Informe o titulo do material."
        if (!form.markdown.trim() && !form.attachments.some((attachment) => attachment.url?.trim())) {
            errors.content = "Adicione texto ou ao menos um anexo enviado."
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
        const success = await handleCreateMaterial(form)
        setLocalCreating(false)
        if (success) {
            resetForm()
        }
    }

    const startMaterialEditing = (material: { id: string; title: string; markdown?: string }) => {
        setEditingMaterialId(material.id)
        setEditingTitle(material.title)
        setEditingMarkdown(material.markdown ?? "")
    }

    const cancelMaterialEditing = () => {
        setEditingMaterialId(null)
        setEditingTitle("")
        setEditingMarkdown("")
        setLocalUpdating(false)
    }

    const saveMaterialEditing = async () => {
        if (!editingMaterialId || !editingTitle.trim()) {
            toast.error("Informe um titulo valido")
            return
        }
        setLocalUpdating(true)
        await handleUpdateMaterial({
            id: editingMaterialId,
            title: editingTitle.trim(),
            markdown: editingMarkdown,
        })
        setLocalUpdating(false)
        cancelMaterialEditing()
    }

    const inferAttachmentType = (file: File): MaterialForm["attachments"][number]["type"] => {
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
            const result = await uploadImage(formData, "materials")
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
            setValidationErrors((prev) => ({ ...prev, content: undefined }))
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

    const toggleUserSelection = (uid: string) => {
        setForm((prev) => ({
            ...prev,
            userIds: prev.userIds.includes(uid)
                ? prev.userIds.filter((id) => id !== uid)
                : [...prev.userIds, uid],
        }))
        setValidationErrors((prev) => ({ ...prev, users: undefined }))
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
                next[startIndex + offset] = {
                    status: "uploading",
                    message: `Preparando ${file.name}...`,
                }
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
                {showCreatePanel ? (
                    <>
                <Card className="border-primary/20 bg-card/40 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-base font-bold">Conteúdo do Material</CardTitle>
                        <p className="text-xs text-muted-foreground leading-relaxed">Defina os tópicos, textos e arquivos de apoio.</p>
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
                                    placeholder="Ex.: Checklist de Apresentação"
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

                        <div className="space-y-3">
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
                                                            id={`file-upload-${idx}`}
                                                            className="hidden"
                                                            onChange={(e) => void handleFileUpload(idx, e)}
                                                        />
                                                        <Button
                                                            variant="ghost"
                                                            size="icon-xs"
                                                            type="button"
                                                            disabled={uploadingIndices[idx]}
                                                            onClick={() => document.getElementById(`file-upload-${idx}`)?.click()}
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

                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60">Texto Markdown (Opcional)</Label>
                            <div className="rounded-xl overflow-hidden bg-background/40 p-1">
                                <MarkdownEditor
                                    value={form.markdown}
                                    onChange={(val) => {
                                        const value = val || ""
                                        setForm((p) => ({ ...p, markdown: value }))
                                        if (value.trim()) {
                                            setValidationErrors((prev) => ({ ...prev, content: undefined }))
                                        }
                                    }}
                                    height={200}
                                    preview="live"
                                    visibleDragbar={false}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-primary/20 bg-card/40 backdrop-blur-sm">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-base font-bold">Configurações de Acesso</CardTitle>
                        <p className="text-xs text-muted-foreground leading-relaxed">Defina quem e quando poderá acessar este material.</p>
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
                                        <Users2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/40" />
                                    </div>
                                    <div className="rounded-lg border border-primary/10 bg-background/70 p-2">
                                        <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">Selecionados</p>
                                        <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto custom-scrollbar">
                                            {selectedUsers.length === 0 ? (
                                                <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/40 text-center w-full py-3 bg-primary/5 rounded-lg">Nenhum aluno selecionado</p>
                                            ) : (
                                                selectedUsers.map((u) => (
                                                    <span key={u.uid} className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 border border-primary/20 px-2 py-1 text-[10px] font-medium text-primary">
                                                        {u.name}
                                                        <button type="button" onClick={() => toggleUserSelection(u.uid)} className="hover:text-destructive opacity-70 hover:opacity-100 transition-opacity">
                                                            <X className="size-3" />
                                                        </button>
                                                    </span>
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

                        <div className="pt-2 flex flex-col gap-2">
                            {Object.values(validationErrors).some(Boolean) ? (
                                <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-2 text-xs text-destructive">
                                    {Object.values(validationErrors)
                                        .filter((message): message is string => Boolean(message))
                                        .map((message, idx) => (
                                            <p key={`${message}-${idx}`}>{message}</p>
                                        ))}
                                </div>
                            ) : null}
                            <Button onClick={onSubmit} disabled={localCreating} className="flex-1 h-10 shadow-md shadow-primary/20 hover:shadow-primary/30 text-xs font-bold uppercase tracking-wider">
                                {localCreating ? "Salvando..." : "Salvar Material"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
                    </>
                ) : null}
            </div>

            {/* List Card */}
            <Card className="border-primary/20 bg-card/20 backdrop-blur-sm h-fit overflow-hidden lg:sticky lg:top-6">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-base font-bold">Biblioteca do Curso</CardTitle>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Documentos e Aulas</p>
                    </div>
                    <Button variant="ghost" size="xs" onClick={() => void loadMaterials(true)} disabled={loading.materials} className="text-[10px] font-bold uppercase tracking-widest">Atualizar</Button>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {loading.materials ? (
                            <div className="h-32 flex items-center justify-center text-muted-foreground animate-pulse text-[10px] uppercase font-bold tracking-widest">Sincronizando...</div>
                        ) : tracks.length === 0 || materials.length === 0 ? (
                            <p className="text-[10px] text-muted-foreground/40 text-center py-8 font-bold uppercase tracking-widest">Nenhum material cadastrado</p>
                        ) : (
                            tracks.map(track => {
                                const trackMaterials = materials.filter(m => m.trackId === track.id)
                                if (!trackMaterials.length) return null
                                return (
                                    <div key={track.id} className="space-y-3">
                                        <p className="wrap-break-word text-[10px] font-bold uppercase tracking-[0.2em] text-primary/60 border-b border-primary/20 pb-1 mb-3">{track.title}</p>
                                        {trackMaterials.map((m) => {
                                            const primaryAtt = m.attachments?.[0]?.type || "link"
                                            const Icon = MATERIAL_TYPE_ICONS[primaryAtt as keyof typeof MATERIAL_TYPE_ICONS] || FileText
                                            return (
                                                <Collapsible key={m.id} className="overflow-hidden rounded-2xl border border-primary/10 bg-background/60 p-3 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
                                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                                        <div className="flex min-w-0 flex-1 items-start gap-3">
                                                            <div className="size-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                                                <Icon className="size-4" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-xs font-bold tracking-tight wrap-break-word">{m.title}</p>
                                                                <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                                                                    <span className="rounded-full bg-primary/10 px-2 py-0.5 font-semibold uppercase text-primary">{m.visibility}</span>
                                                                    <span>{m.attachments?.length || 0} anexo(s)</span>
                                                                    <span>{m.markdown?.trim() ? "com texto" : "sem texto"}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1 self-end sm:self-auto">
                                                            {editingMaterialId === m.id ? (
                                                                <>
                                                                    <Button
                                                                        variant="outline"
                                                                        size="xs"
                                                                        type="button"
                                                                        disabled={localUpdating}
                                                                        onClick={() => void saveMaterialEditing()}
                                                                        className="text-[10px] uppercase font-bold tracking-widest"
                                                                    >
                                                                        {localUpdating ? "Salvando..." : "Salvar"}
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="xs"
                                                                        type="button"
                                                                        disabled={localUpdating}
                                                                        onClick={cancelMaterialEditing}
                                                                        className="text-[10px] uppercase font-bold tracking-widest"
                                                                    >
                                                                        Cancelar
                                                                    </Button>
                                                                </>
                                                            ) : (
                                                                <Button
                                                                    variant="outline"
                                                                    size="xs"
                                                                    type="button"
                                                                    onClick={() => startMaterialEditing(m)}
                                                                    className="text-[10px] uppercase font-bold tracking-widest"
                                                                >
                                                                    Editar
                                                                </Button>
                                                            )}
                                                            <Button
                                                                variant="ghost"
                                                                size="icon-xs"
                                                                onClick={() => handleDeleteMaterial(m)}
                                                                className="text-destructive/60 hover:text-destructive"
                                                                aria-label="Excluir material"
                                                            >
                                                                <X className="size-3" />
                                                            </Button>
                                                            <CollapsibleTrigger asChild>
                                                                <Button variant="ghost" size="icon-xs" type="button" aria-label="Expandir material" className="group">
                                                                    <ChevronDown className="size-3 transition-transform group-data-[state=open]:rotate-180" />
                                                                </Button>
                                                            </CollapsibleTrigger>
                                                        </div>
                                                    </div>
                                                    <CollapsibleContent className="mt-3 space-y-3">
                                                        {editingMaterialId === m.id ? (
                                                            <div className="space-y-2 rounded-xl border border-primary/15 bg-background/70 p-2">
                                                                <Input
                                                                    value={editingTitle}
                                                                    onChange={(e) => setEditingTitle(e.target.value)}
                                                                    placeholder="Titulo do material"
                                                                    className="h-8 text-xs"
                                                                />
                                                                <div className="rounded-lg overflow-hidden bg-background/60 p-1">
                                                                    <MarkdownEditor
                                                                        value={editingMarkdown}
                                                                        onChange={(val) => setEditingMarkdown(val || "")}
                                                                        height={180}
                                                                        preview="edit"
                                                                        visibleDragbar={false}
                                                                    />
                                                                </div>
                                                            </div>
                                                        ) : (m.markdown?.trim() ? (
                                                            <div className="max-h-44 overflow-auto text-xs">
                                                                <MarkdownPreview
                                                                    source={m.markdown}
                                                                    style={{ backgroundColor: "transparent", padding: 0, maxWidth: "100%", overflowX: "auto" }}
                                                                />
                                                            </div>
                                                        ) : (
                                                            <p className="text-[10px] text-muted-foreground/60">Sem texto markdown neste material.</p>
                                                        ))}
                                                        {(m.attachments?.length ?? 0) > 0 ? (
                                                            <div className="grid gap-2">
                                                                {(m.attachments ?? []).map((attachment, idx) => (
                                                                    <div key={`${m.id}-${idx}`} className="rounded-lg border border-primary/10 bg-primary/5 px-2 py-1.5">
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
                                                                                    onClick={() => void handleDeleteMaterialAttachment(m.id, attachment.url)}
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
                                                            <p className="text-[10px] text-muted-foreground/60">Sem anexos neste material.</p>
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


