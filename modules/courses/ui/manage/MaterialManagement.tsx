"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import {
    Copy,
    Eye,
    FileText,
    Trash2,
    X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCourseManagement, MaterialForm } from "./CourseManagementContext"
import { AttachmentUploadQueue } from "./AttachmentUploadQueue"
import { ReleaseControls } from "./ReleaseControls"
import { UserAssignmentPicker } from "./UserAssignmentPicker"
import { MATERIAL_TYPE_ICONS } from "./constants"
import { deleteImage, getPublicIdFromUrl, uploadImage } from "@/lib/cloudinary-actions"
import type { AdminUserSummary, Material, Track } from "@/lib/firebase/types"
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

type MaterialManagementProps = Readonly<{
    showCreatePanel: boolean
}>

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
    const uploadIntervalsRef = React.useRef<Record<number, ReturnType<typeof setInterval>>>({})
    const [editingMaterialId, setEditingMaterialId] = React.useState<string | null>(null)
    const [editingTitle, setEditingTitle] = React.useState("")
    const [editingMarkdown, setEditingMarkdown] = React.useState("")
    const [selectedMaterialId, setSelectedMaterialId] = React.useState("")
    const [materialTab, setMaterialTab] = React.useState<"overview" | "content" | "attachments">("overview")
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

    const startMaterialEditing = (material: Pick<Material, "id" | "title" | "markdown">) => {
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

    const handleCopyAttachmentLink = async (url: string) => {
        try {
            await navigator.clipboard.writeText(url)
            toast.success("Link do anexo copiado")
        } catch {
            toast.error("Nao foi possivel copiar o link")
        }
    }

    const selectedUsers = React.useMemo<AdminUserSummary[]>(() => {
        return availableUsers.filter((user) => form.userIds.includes(user.uid))
    }, [availableUsers, form.userIds])

    const suggestedUsers = React.useMemo<AdminUserSummary[]>(() => {
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

    const trackById = React.useMemo(() => {
        return new Map(tracks.map((track) => [track.id, track]))
    }, [tracks])

    const materialsOrdered = React.useMemo(() => {
        return [...materials].sort((a, b) => {
            const aTrackOrder = a.trackId ? (trackById.get(a.trackId)?.order ?? Number.MAX_SAFE_INTEGER) : Number.MAX_SAFE_INTEGER
            const bTrackOrder = b.trackId ? (trackById.get(b.trackId)?.order ?? Number.MAX_SAFE_INTEGER) : Number.MAX_SAFE_INTEGER
            if (aTrackOrder !== bTrackOrder) return aTrackOrder - bTrackOrder

            const aTrackTitle = a.trackId ? (trackById.get(a.trackId)?.title ?? "") : ""
            const bTrackTitle = b.trackId ? (trackById.get(b.trackId)?.title ?? "") : ""
            const byTrackTitle = aTrackTitle.localeCompare(bTrackTitle)
            if (byTrackTitle !== 0) return byTrackTitle

            return a.title.localeCompare(b.title)
        })
    }, [materials, trackById])

    React.useEffect(() => {
        if (materialsOrdered.length === 0) {
            setSelectedMaterialId("")
            return
        }

        const exists = materialsOrdered.some((material) => material.id === selectedMaterialId)
        if (!exists) {
            setSelectedMaterialId(materialsOrdered[0]?.id ?? "")
        }
    }, [materialsOrdered, selectedMaterialId])

    React.useEffect(() => {
        setMaterialTab("overview")
    }, [selectedMaterialId])

    const selectedMaterial = React.useMemo(() => {
        return materialsOrdered.find((material) => material.id === selectedMaterialId) ?? null
    }, [materialsOrdered, selectedMaterialId])

    return (
        <>
            <MaterialCreationPanel
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
            onMarkdownChange={(value) => {
                setForm((p) => ({ ...p, markdown: value }))
                if (value.trim()) setValidationErrors((prev) => ({ ...prev, content: undefined }))
            }}
            onVisibilityChange={(value) => {
                setForm((p) => ({ ...p, visibility: value }))
                if (value !== "users") setValidationErrors((prev) => ({ ...prev, users: undefined }))
            }}
            onScheduleModeChange={(mode) => setForm((p) => ({ ...p, scheduleMode: mode }))}
            onReleaseAtChange={(value) => setForm((p) => ({ ...p, releaseAt: value }))}
        />
        <MaterialLibraryPanel
            tracks={tracks}
            materials={materials}
            loading={loading}
            materialsOrdered={materialsOrdered}
            selectedMaterialId={selectedMaterialId}
            onSelectedMaterialIdChange={setSelectedMaterialId}
            trackById={trackById}
            selectedMaterial={selectedMaterial}
            editingMaterialId={editingMaterialId}
            editingTitle={editingTitle}
            editingMarkdown={editingMarkdown}
            localUpdating={localUpdating}
            materialTab={materialTab}
            onMaterialTabChange={setMaterialTab}
            onLoadMaterials={() => void loadMaterials(true)}
            onStartEditing={(material) => startMaterialEditing(material)}
            onCancelEditing={cancelMaterialEditing}
            onSaveEditing={() => void saveMaterialEditing()}
            onDeleteMaterial={handleDeleteMaterial}
            onUpdateEditingTitle={setEditingTitle}
            onUpdateEditingMarkdown={(value) => setEditingMarkdown(value)}
            onCopyAttachmentLink={handleCopyAttachmentLink}
            onDeleteMaterialAttachment={handleDeleteMaterialAttachment}
        />
        </>
    )
}

type MaterialCreationPanelProps = Readonly<{
    showCreatePanel: boolean
    tracks: Track[]
    form: MaterialForm
    validationErrors: MaterialValidationErrors
    localCreating: boolean
    userSearch: string
    selectedUsers: AdminUserSummary[]
    suggestedUsers: AdminUserSummary[]
    uploadingIndices: Record<number, boolean>
    uploadFeedback: Record<number, UploadFeedbackState>
    uploadProgress: Record<number, number>
    onUserSearchChange: (value: string) => void
    onToggleUser: (uid: string) => void
    onFormChange: React.Dispatch<React.SetStateAction<MaterialForm>>
    onValidationErrorClear: (key: keyof MaterialValidationErrors) => void
    onAddFiles: (files: File[]) => Promise<void>
    onRetryUpload: (index: number, file: File) => Promise<void>
    onRemoveAttachment: (index: number) => Promise<void>
    onAttachmentTypeChange: (index: number, type: MaterialForm["attachments"][number]["type"]) => void
    onAttachmentNameChange: (index: number, name: string) => void
    onCopyAttachmentLink: (url: string) => Promise<void>
    onSubmit: () => Promise<void>
    onMarkdownChange: (value: string) => void
    onVisibilityChange: (value: MaterialForm["visibility"]) => void
    onScheduleModeChange: (mode: MaterialForm["scheduleMode"]) => void
    onReleaseAtChange: (value: string) => void
}>

function MaterialCreationPanel(props: Readonly<MaterialCreationPanelProps>) {
    const {
        showCreatePanel,
        tracks,
        form,
        validationErrors,
        localCreating,
        userSearch,
        selectedUsers,
        suggestedUsers,
        uploadingIndices,
        uploadFeedback,
        uploadProgress,
        onUserSearchChange,
        onToggleUser,
        onFormChange,
        onValidationErrorClear,
        onAddFiles,
        onRetryUpload,
        onRemoveAttachment,
        onAttachmentTypeChange,
        onAttachmentNameChange,
        onCopyAttachmentLink,
        onSubmit,
        onMarkdownChange,
        onVisibilityChange,
        onScheduleModeChange,
        onReleaseAtChange,
    } = props

    if (!showCreatePanel) return null

    return (
        <div className="flex flex-col gap-6">
            <Card className="border-primary/20 bg-card/40 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="text-base font-bold">Conteúdo do Material</CardTitle>
                    <p className="text-xs leading-relaxed text-muted-foreground">Defina os tópicos, textos e arquivos de apoio.</p>
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
                                    onFormChange((p) => ({ ...p, trackId: value }))
                                    if (value.trim()) onValidationErrorClear("trackId")
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
                                    onFormChange((p) => ({ ...p, title: value }))
                                    if (value.trim()) onValidationErrorClear("title")
                                }}
                                className={`bg-background/50 ${validationErrors.title ? "border-destructive/60" : "border-primary/20"}`}
                            />
                        </div>
                    </div>

                    <AttachmentUploadQueue
                        label="Anexos"
                        helperText="Use a area abaixo para clicar ou arrastar arquivos"
                        emptyStateLabel="Nenhum anexo na fila"
                        attachments={form.attachments}
                        uploadingIndices={uploadingIndices}
                        uploadFeedback={uploadFeedback}
                        uploadProgress={uploadProgress}
                        onRetryUpload={onRetryUpload}
                        onAddFiles={onAddFiles}
                        onRemoveAttachment={onRemoveAttachment}
                        onAttachmentTypeChange={onAttachmentTypeChange}
                        onAttachmentNameChange={onAttachmentNameChange}
                        onCopyLink={onCopyAttachmentLink}
                    />

                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60">Texto Markdown (Opcional)</Label>
                        <div className="rounded-xl bg-background/40 p-1 overflow-hidden">
                            <MarkdownEditor
                                value={form.markdown}
                                onChange={(val) => onMarkdownChange(val ?? "")}
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
                    <p className="text-xs leading-relaxed text-muted-foreground">Defina quem e quando poderá acessar este material.</p>
                </CardHeader>
                <CardContent className="space-y-6">
                    <ReleaseControls
                        visibility={form.visibility}
                        onVisibilityChange={onVisibilityChange}
                        scheduleMode={form.scheduleMode}
                        onScheduleModeChange={onScheduleModeChange}
                        releaseAt={form.releaseAt}
                        onReleaseAtChange={onReleaseAtChange}
                    >
                        {form.visibility === "users" ? (
                            <UserAssignmentPicker
                                label="Acesso Restrito"
                                helperText="Somente alunos selecionados poderão visualizar."
                                searchValue={userSearch}
                                onSearchValueChange={onUserSearchChange}
                                selectedUsers={selectedUsers}
                                suggestedUsers={suggestedUsers}
                                selectedCount={form.userIds.length}
                                emptyStateLabel="Nenhum aluno selecionado"
                                onToggleUser={onToggleUser}
                            />
                        ) : null}
                    </ReleaseControls>

                    <div className="flex flex-col gap-2 pt-2">
                        {Object.values(validationErrors).some(Boolean) ? (
                            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-2 text-xs text-destructive">
                                {Object.values(validationErrors)
                                    .filter((message): message is string => Boolean(message))
                                    .map((message, idx) => (
                                        <p key={`${message}-${idx}`}>{message}</p>
                                    ))}
                            </div>
                        ) : null}
                        <Button onClick={() => void onSubmit()} disabled={localCreating} className="flex-1 h-10 shadow-md shadow-primary/20 hover:shadow-primary/30 text-xs font-bold uppercase tracking-wider">
                            {localCreating ? "Salvando..." : "Salvar Material"}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

type MaterialLibraryPanelProps = Readonly<{
    tracks: Track[]
    materials: Material[]
    loading: { materials: boolean }
    materialsOrdered: Material[]
    selectedMaterialId: string
    onSelectedMaterialIdChange: (value: string) => void
    trackById: Map<string, Track>
    selectedMaterial: Material | null
    editingMaterialId: string | null
    editingTitle: string
    editingMarkdown: string
    localUpdating: boolean
    materialTab: "overview" | "content" | "attachments"
    onMaterialTabChange: (value: "overview" | "content" | "attachments") => void
    onLoadMaterials: () => void
    onStartEditing: (material: Pick<Material, "id" | "title" | "markdown">) => void
    onCancelEditing: () => void
    onSaveEditing: () => void
    onDeleteMaterial: (material: Material) => void
    onUpdateEditingTitle: (value: string) => void
    onUpdateEditingMarkdown: (value: string) => void
    onCopyAttachmentLink: (url: string) => Promise<void>
    onDeleteMaterialAttachment: (materialId: string, attachmentUrl: string) => void
}>

function MaterialLibraryPanel(props: Readonly<MaterialLibraryPanelProps>) {
    const {
        tracks,
        materials,
        loading,
        materialsOrdered,
        selectedMaterialId,
        onSelectedMaterialIdChange,
        trackById,
        selectedMaterial,
        editingMaterialId,
        editingTitle,
        editingMarkdown,
        localUpdating,
        materialTab,
        onMaterialTabChange,
        onLoadMaterials,
        onStartEditing,
        onCancelEditing,
        onSaveEditing,
        onDeleteMaterial,
        onUpdateEditingTitle,
        onUpdateEditingMarkdown,
        onCopyAttachmentLink,
        onDeleteMaterialAttachment,
    } = props

    const selectedMaterialType = selectedMaterial?.attachments?.[0]?.type ?? "link"
    const SelectedIcon = MATERIAL_TYPE_ICONS[selectedMaterialType] ?? FileText

    return (
        <Card className="border-primary/20 bg-card/20 backdrop-blur-sm h-fit overflow-hidden lg:sticky lg:top-6">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-base font-bold">Biblioteca do Curso</CardTitle>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Documentos e Aulas</p>
                </div>
                <Button variant="ghost" size="xs" onClick={onLoadMaterials} disabled={loading.materials} className="text-[10px] font-bold uppercase tracking-widest">Atualizar</Button>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {renderMaterialLibraryBody({
                        loading,
                        tracks,
                        materials,
                        materialsOrdered,
                        selectedMaterialId,
                        onSelectedMaterialIdChange,
                        trackById,
                        selectedMaterial,
                        editingMaterialId,
                        editingTitle,
                        editingMarkdown,
                        localUpdating,
                        materialTab,
                        onMaterialTabChange,
                        onLoadMaterials,
                        onStartEditing,
                        onCancelEditing,
                        onSaveEditing,
                        onDeleteMaterial,
                        onUpdateEditingTitle,
                        onUpdateEditingMarkdown,
                        onCopyAttachmentLink,
                        onDeleteMaterialAttachment,
                        SelectedIcon,
                    })}
                </div>
            </CardContent>
        </Card>
    )
}

type MaterialLibraryBodyProps = Readonly<{
    loading: { materials: boolean }
    tracks: Track[]
    materials: Material[]
    materialsOrdered: Material[]
    selectedMaterialId: string
    onSelectedMaterialIdChange: (value: string) => void
    trackById: Map<string, Track>
    selectedMaterial: Material | null
    editingMaterialId: string | null
    editingTitle: string
    editingMarkdown: string
    localUpdating: boolean
    materialTab: "overview" | "content" | "attachments"
    onMaterialTabChange: (value: "overview" | "content" | "attachments") => void
    onLoadMaterials: () => void
    onStartEditing: (material: Pick<Material, "id" | "title" | "markdown">) => void
    onCancelEditing: () => void
    onSaveEditing: () => void
    onDeleteMaterial: (material: Material) => void
    onUpdateEditingTitle: (value: string) => void
    onUpdateEditingMarkdown: (value: string) => void
    onCopyAttachmentLink: (url: string) => Promise<void>
    onDeleteMaterialAttachment: (materialId: string, attachmentUrl: string) => void
    SelectedIcon: React.ElementType
}>

function renderMaterialLibraryBody({
    loading,
    tracks,
    materials,
    materialsOrdered,
    selectedMaterialId,
    onSelectedMaterialIdChange,
    trackById,
    selectedMaterial,
    editingMaterialId,
    editingTitle,
    editingMarkdown,
    localUpdating,
    materialTab,
    onMaterialTabChange,
    onStartEditing,
    onCancelEditing,
    onSaveEditing,
    onDeleteMaterial,
    onUpdateEditingTitle,
    onUpdateEditingMarkdown,
    onCopyAttachmentLink,
    onDeleteMaterialAttachment,
    SelectedIcon,
}: MaterialLibraryBodyProps) {
    if (loading.materials) {
        return <LoadingState label="Sincronizando..." />
    }

    if (tracks.length === 0 || materials.length === 0) {
        return <EmptyState label="Nenhum material cadastrado" />
    }

    return (
        <div className="space-y-4">
            <MaterialSummaryStats materialsOrdered={materialsOrdered} />
            <MaterialSelectionPanel
                materialsOrdered={materialsOrdered}
                selectedMaterialId={selectedMaterialId}
                onSelectedMaterialIdChange={onSelectedMaterialIdChange}
                trackById={trackById}
                selectedMaterial={selectedMaterial}
                editingMaterialId={editingMaterialId}
                editingTitle={editingTitle}
                editingMarkdown={editingMarkdown}
                localUpdating={localUpdating}
                materialTab={materialTab}
                onMaterialTabChange={onMaterialTabChange}
                onStartEditing={onStartEditing}
                onCancelEditing={onCancelEditing}
                onSaveEditing={onSaveEditing}
                onDeleteMaterial={onDeleteMaterial}
                onUpdateEditingTitle={onUpdateEditingTitle}
                onUpdateEditingMarkdown={onUpdateEditingMarkdown}
                onCopyAttachmentLink={onCopyAttachmentLink}
                onDeleteMaterialAttachment={onDeleteMaterialAttachment}
                SelectedIcon={SelectedIcon}
            />
        </div>
    )
}

function MaterialSummaryStats({ materialsOrdered }: Readonly<{ materialsOrdered: Material[] }>) {
    return (
        <div className="grid gap-2 sm:grid-cols-3">
            <MetricCard label="Materiais" value={materialsOrdered.length} />
            <MetricCard label="Com anexo" value={materialsOrdered.filter((material) => (material.attachments?.length ?? 0) > 0).length} />
            <MetricCard label="Com texto" value={materialsOrdered.filter((material) => Boolean(material.markdown?.trim())).length} />
        </div>
    )
}

type MaterialSelectionPanelProps = Readonly<{
    materialsOrdered: Material[]
    selectedMaterialId: string
    onSelectedMaterialIdChange: (value: string) => void
    trackById: Map<string, Track>
    selectedMaterial: Material | null
    editingMaterialId: string | null
    editingTitle: string
    editingMarkdown: string
    localUpdating: boolean
    materialTab: "overview" | "content" | "attachments"
    onMaterialTabChange: (value: "overview" | "content" | "attachments") => void
    onStartEditing: (material: Pick<Material, "id" | "title" | "markdown">) => void
    onCancelEditing: () => void
    onSaveEditing: () => void
    onDeleteMaterial: (material: Material) => void
    onUpdateEditingTitle: (value: string) => void
    onUpdateEditingMarkdown: (value: string) => void
    onCopyAttachmentLink: (url: string) => Promise<void>
    onDeleteMaterialAttachment: (materialId: string, attachmentUrl: string) => void
    SelectedIcon: React.ElementType
}>

function MaterialSelectionPanel({
    materialsOrdered,
    selectedMaterialId,
    onSelectedMaterialIdChange,
    trackById,
    selectedMaterial,
    editingMaterialId,
    editingTitle,
    editingMarkdown,
    localUpdating,
    materialTab,
    onMaterialTabChange,
    onStartEditing,
    onCancelEditing,
    onSaveEditing,
    onDeleteMaterial,
    onUpdateEditingTitle,
    onUpdateEditingMarkdown,
    onCopyAttachmentLink,
    onDeleteMaterialAttachment,
    SelectedIcon,
}: Readonly<MaterialSelectionPanelProps>) {
    if (!selectedMaterial) {
        return (
            <div className="rounded-xl border border-primary/10 bg-background/70 p-3">
                <MaterialSelectField
                    materialsOrdered={materialsOrdered}
                    selectedMaterialId={selectedMaterialId}
                    onSelectedMaterialIdChange={onSelectedMaterialIdChange}
                    trackById={trackById}
                />
                <p className="mt-3 text-[11px] text-muted-foreground/70">Selecione um material para visualizar detalhes.</p>
            </div>
        )
    }

    const isEditing = editingMaterialId === selectedMaterial.id

    return (
        <div className="space-y-3 rounded-xl border border-primary/10 bg-background/70 p-3">
            <MaterialSelectField
                materialsOrdered={materialsOrdered}
                selectedMaterialId={selectedMaterialId}
                onSelectedMaterialIdChange={onSelectedMaterialIdChange}
                trackById={trackById}
            />
            <MaterialHeader
                selectedMaterial={selectedMaterial}
                SelectedIcon={SelectedIcon}
                isEditing={isEditing}
                localUpdating={localUpdating}
                onStartEditing={onStartEditing}
                onCancelEditing={onCancelEditing}
                onSaveEditing={onSaveEditing}
                onDeleteMaterial={onDeleteMaterial}
            />
            <MaterialTabBar materialTab={materialTab} onMaterialTabChange={onMaterialTabChange} />
            {materialTab === "overview" ? <MaterialOverviewPanel selectedMaterial={selectedMaterial} trackById={trackById} /> : null}
            {materialTab === "content" ? (
                <MaterialContentPanel
                    selectedMaterial={selectedMaterial}
                    isEditing={isEditing}
                    editingTitle={editingTitle}
                    editingMarkdown={editingMarkdown}
                    onUpdateEditingTitle={onUpdateEditingTitle}
                    onUpdateEditingMarkdown={onUpdateEditingMarkdown}
                />
            ) : null}
            {materialTab === "attachments" ? (
                <MaterialAttachmentsPanel
                    selectedMaterial={selectedMaterial}
                    onCopyAttachmentLink={onCopyAttachmentLink}
                    onDeleteMaterialAttachment={onDeleteMaterialAttachment}
                />
            ) : null}
        </div>
    )
}

function MaterialSelectField({
    materialsOrdered,
    selectedMaterialId,
    onSelectedMaterialIdChange,
    trackById,
}: Readonly<{
    materialsOrdered: Material[]
    selectedMaterialId: string
    onSelectedMaterialIdChange: (value: string) => void
    trackById: Map<string, Track>
}>) {
    return (
        <div className="space-y-1">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Material selecionado</Label>
            <select
                value={selectedMaterialId}
                onChange={(event) => onSelectedMaterialIdChange(event.target.value)}
                className="h-9 w-full rounded-md border border-primary/20 bg-background/80 px-3 text-xs font-semibold outline-none transition-all focus:border-primary/30"
            >
                {materialsOrdered.map((material) => {
                    const trackTitle = material.trackId ? (trackById.get(material.trackId)?.title ?? "Sem modulo") : "Sem modulo"
                    return (
                        <option key={material.id} value={material.id}>
                            [{trackTitle}] {material.title}
                        </option>
                    )
                })}
            </select>
        </div>
    )
}

function MaterialHeader({
    selectedMaterial,
    SelectedIcon,
    isEditing,
    localUpdating,
    onStartEditing,
    onCancelEditing,
    onSaveEditing,
    onDeleteMaterial,
}: Readonly<{
    selectedMaterial: Material
    SelectedIcon: React.ElementType
    isEditing: boolean
    localUpdating: boolean
    onStartEditing: (material: Pick<Material, "id" | "title" | "markdown">) => void
    onCancelEditing: () => void
    onSaveEditing: () => void
    onDeleteMaterial: (material: Material) => void
}>) {
    return (
        <div className="rounded-xl border border-primary/10 bg-primary/5 p-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                    <div className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <SelectedIcon className="size-4" />
                    </div>
                    <div className="min-w-0">
                        <p className="wrap-break-word text-sm font-bold leading-tight">{selectedMaterial.title}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 font-semibold uppercase text-primary">{selectedMaterial.visibility ?? "module"}</span>
                            <span>{selectedMaterial.attachments?.length || 0} anexo(s)</span>
                            <span>{selectedMaterial.markdown?.trim() ? "com texto" : "sem texto"}</span>
                        </div>
                    </div>
                </div>
                <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
                    {isEditing ? (
                        <>
                            <Button variant="outline" size="xs" type="button" disabled={localUpdating} onClick={onSaveEditing} className="text-[10px] font-bold uppercase tracking-widest">
                                {localUpdating ? "Salvando..." : "Salvar"}
                            </Button>
                            <Button variant="ghost" size="xs" type="button" disabled={localUpdating} onClick={onCancelEditing} className="text-[10px] font-bold uppercase tracking-widest">
                                Cancelar
                            </Button>
                        </>
                    ) : (
                        <Button variant="outline" size="xs" type="button" onClick={() => onStartEditing(selectedMaterial)} className="text-[10px] font-bold uppercase tracking-widest">
                            Editar
                        </Button>
                    )}
                    <Button variant="ghost" size="icon-xs" onClick={() => onDeleteMaterial(selectedMaterial)} className="text-destructive/60 hover:text-destructive" aria-label="Excluir material selecionado">
                        <X className="size-3" />
                    </Button>
                </div>
            </div>
        </div>
    )
}

function MaterialTabBar({
    materialTab,
    onMaterialTabChange,
}: Readonly<{
    materialTab: "overview" | "content" | "attachments"
    onMaterialTabChange: (value: "overview" | "content" | "attachments") => void
}>) {
    return (
        <div className="inline-flex items-center gap-1 rounded-xl border border-primary/15 bg-primary/5 p-1">
            {[
                { id: "overview" as const, label: "Visao geral" },
                { id: "content" as const, label: "Conteudo" },
                { id: "attachments" as const, label: "Anexos" },
            ].map((tab) => (
                <Button
                    key={tab.id}
                    type="button"
                    size="xs"
                    variant={materialTab === tab.id ? "default" : "ghost"}
                    className="rounded-lg text-[10px] font-bold uppercase tracking-widest"
                    onClick={() => onMaterialTabChange(tab.id)}
                >
                    {tab.label}
                </Button>
            ))}
        </div>
    )
}

function MaterialOverviewPanel({
    selectedMaterial,
    trackById,
}: Readonly<{
    selectedMaterial: Material
    trackById: Map<string, Track>
}>) {
    const trackTitle = selectedMaterial.trackId ? (trackById.get(selectedMaterial.trackId)?.title ?? "Sem modulo") : "Sem modulo"
    const releaseLabel = selectedMaterial.releaseAt ? new Date(selectedMaterial.releaseAt).toLocaleDateString("pt-BR") : "Agora"

    return (
        <div className="grid gap-2 sm:grid-cols-3">
            <MetricCard label="Modulo" value={trackTitle} />
            <MetricCard label="Visibilidade" value={(selectedMaterial.visibility ?? "module").toUpperCase()} />
            <MetricCard label="Disponivel em" value={releaseLabel} />
        </div>
    )
}

function MaterialContentPanel({
    selectedMaterial,
    isEditing,
    editingTitle,
    editingMarkdown,
    onUpdateEditingTitle,
    onUpdateEditingMarkdown,
}: Readonly<{
    selectedMaterial: Material
    isEditing: boolean
    editingTitle: string
    editingMarkdown: string
    onUpdateEditingTitle: (value: string) => void
    onUpdateEditingMarkdown: (value: string) => void
}>) {
    if (isEditing) {
        return (
            <div className="space-y-2 rounded-xl border border-primary/15 bg-background/80 p-2">
                <Input value={editingTitle} onChange={(event) => onUpdateEditingTitle(event.target.value)} placeholder="Titulo do material" className="h-8 text-xs" />
                <div className="overflow-hidden rounded-lg bg-background/60 p-1">
                    <MarkdownEditor value={editingMarkdown} onChange={(val) => onUpdateEditingMarkdown(val ?? "")} height={220} preview="edit" visibleDragbar={false} />
                </div>
            </div>
        )
    }

    if (selectedMaterial.markdown?.trim()) {
        return (
            <div className="max-h-60 overflow-auto rounded-xl border border-primary/10 bg-background/80 p-3 text-xs">
                <MarkdownPreview source={selectedMaterial.markdown} style={{ backgroundColor: "transparent", padding: 0, maxWidth: "100%", overflowX: "auto" }} />
            </div>
        )
    }

    return <EmptyState label="Sem texto markdown neste material." />
}

function MaterialAttachmentsPanel({
    selectedMaterial,
    onCopyAttachmentLink,
    onDeleteMaterialAttachment,
}: Readonly<{
    selectedMaterial: Material
    onCopyAttachmentLink: (url: string) => Promise<void>
    onDeleteMaterialAttachment: (materialId: string, attachmentUrl: string) => void
}>) {
    const attachments = selectedMaterial.attachments ?? []

    if (attachments.length === 0) {
        return <EmptyState label="Sem anexos neste material." />
    }

    return (
        <div className="grid gap-2">
            {attachments.map((attachment, index) => (
                <div key={`${selectedMaterial.id}-${index}`} className="rounded-lg border border-primary/10 bg-background/80 px-2 py-1.5">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <p className="min-w-0 break-all text-[11px] font-medium">{attachment.name || `Anexo ${index + 1}`}</p>
                        <div className="flex items-center gap-1 self-end sm:self-auto">
                            {attachment.url ? (
                                <>
                                    <a
                                        href={attachment.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex size-6 items-center justify-center rounded-md border border-primary/20 text-primary hover:bg-primary/10"
                                        aria-label={`Abrir anexo ${attachment.name || index + 1}`}
                                    >
                                        <Eye className="size-3" />
                                    </a>
                                    <Button
                                        variant="ghost"
                                        size="icon-xs"
                                        type="button"
                                        onClick={() => {
                                            onCopyAttachmentLink(attachment.url)
                                        }}
                                        aria-label={`Copiar link ${attachment.name || index + 1}`}
                                    >
                                        <Copy className="size-3" />
                                    </Button>
                                </>
                            ) : null}
                            <Button
                                variant="ghost"
                                size="icon-xs"
                                type="button"
                                onClick={() => onDeleteMaterialAttachment(selectedMaterial.id, attachment.url)}
                                className="text-destructive/60 hover:text-destructive"
                                aria-label={`Excluir anexo ${attachment.name || index + 1}`}
                            >
                                <Trash2 className="size-3" />
                            </Button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}

function LoadingState({ label }: Readonly<{ label: string }>) {
    return (
        <div className="flex h-32 items-center justify-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground animate-pulse">
            {label}
        </div>
    )
}

function EmptyState({ label }: Readonly<{ label: string }>) {
    return <p className="py-8 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">{label}</p>
}

function MetricCard({ label, value }: Readonly<{ label: string; value: string | number }>) {
    return (
        <div className="rounded-xl border border-primary/10 bg-primary/5 p-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{label}</p>
            <p className="text-lg font-bold text-foreground">{value}</p>
        </div>
    )
}
