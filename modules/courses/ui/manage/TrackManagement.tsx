"use client"

import * as React from "react"
import {
    Sparkles,
    Users2,
    X,
    ClipboardList,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCourseManagement, TrackForm } from "./CourseManagementContext"

type TrackManagementProps = {
    showCreatePanel: boolean
    onRequestOpenCreatePanel: () => void
}

export function TrackManagement({ showCreatePanel, onRequestOpenCreatePanel }: TrackManagementProps) {
    const {
        tracks,
        availableUsers,
        loading,
        loadTracks,
        handleCreateOrUpdateTrack,
        handleDeleteTrack,
    } = useCourseManagement()

    const [form, setForm] = React.useState<TrackForm>({
        title: "",
        description: "",
        order: "",
        userIds: [],
    })
    const [editingTrackId, setEditingTrackId] = React.useState<string | null>(null)
    const [selectedTrackId, setSelectedTrackId] = React.useState("")
    const [trackTab, setTrackTab] = React.useState<"overview" | "students">("overview")
    const [userSearch, setUserSearch] = React.useState("")
    const [localCreating, setLocalCreating] = React.useState(false)

    const isEditing = Boolean(editingTrackId)

    const resetForm = () => {
        setForm({ title: "", description: "", order: "", userIds: [] })
        setEditingTrackId(null)
        setUserSearch("")
    }

    const onSubmit = async () => {
        setLocalCreating(true)
        await handleCreateOrUpdateTrack(form, isEditing, editingTrackId)
        setLocalCreating(false)
        resetForm()
    }

    const toggleUserSelection = (uid: string) => {
        setForm((prev) => ({
            ...prev,
            userIds: prev.userIds.includes(uid)
                ? prev.userIds.filter((id) => id !== uid)
                : [...prev.userIds, uid],
        }))
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

    const tracksOrdered = React.useMemo(() => {
        return [...tracks].sort((a, b) => {
            const aOrder = a.order ?? Number.MAX_SAFE_INTEGER
            const bOrder = b.order ?? Number.MAX_SAFE_INTEGER
            if (aOrder !== bOrder) return aOrder - bOrder
            return a.title.localeCompare(b.title)
        })
    }, [tracks])

    React.useEffect(() => {
        if (tracksOrdered.length === 0) {
            setSelectedTrackId("")
            return
        }
        const exists = tracksOrdered.some((track) => track.id === selectedTrackId)
        if (!exists) {
            setSelectedTrackId(tracksOrdered[0]?.id ?? "")
        }
    }, [tracksOrdered, selectedTrackId])

    React.useEffect(() => {
        setTrackTab("overview")
    }, [selectedTrackId])

    const selectedTrack = React.useMemo(() => {
        return tracksOrdered.find((track) => track.id === selectedTrackId) ?? null
    }, [tracksOrdered, selectedTrackId])

    const selectedTrackStudents = React.useMemo(() => {
        if (!selectedTrack) return []
        return availableUsers.filter((user) => (selectedTrack.userIds ?? []).includes(user.uid))
    }, [availableUsers, selectedTrack])

    return (
        <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-[1.2fr,2fr]">
                {/* Form Card */}
                {showCreatePanel ? (
                    <Card className="border-primary/20 bg-card/40 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Sparkles className="size-4 text-primary" />
                            {isEditing ? "Editar módulo" : "Criar módulo"}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            {isEditing
                                ? "Atualize o conteúdo e os participantes do módulo."
                                : "Defina título, resumo, ordem e os usuários do módulo."}
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label required htmlFor="track-title" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60">Título do módulo</Label>
                            <Input
                                id="track-title"
                                placeholder="Ex.: Comunicação estratégica"
                                value={form.title}
                                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                                className="bg-background/50 border-primary/20 transition-all focus:border-primary/30"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label required htmlFor="track-description" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60">Descrição</Label>
                            <textarea
                                id="track-description"
                                className="bg-background/50 text-foreground border-primary/20 min-h-24 w-full rounded-md border p-3 text-sm transition-all focus:border-primary/30 outline-none"
                                placeholder="Objetivo, conteúdo e resultados esperados."
                                value={form.description}
                                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                            />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="track-order" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60">Ordem</Label>
                                <Input
                                    id="track-order"
                                    type="number"
                                    min={1}
                                    placeholder="Ex.: 1"
                                    value={form.order}
                                    onChange={(e) => setForm((p) => ({ ...p, order: e.target.value }))}
                                    className="bg-background/50 border-primary/20"
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60">Alunos no Módulo</Label>
                                <span className="text-[10px] font-bold text-primary px-2 py-0.5 rounded-full bg-primary/5">{form.userIds.length} selecionado(s)</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground/70 leading-relaxed">
                                Alunos adicionados em qualquer módulo são matriculados automaticamente no curso.
                            </p>

                            <Input
                                placeholder="Buscar por nome ou email..."
                                value={userSearch}
                                onChange={(e) => setUserSearch(e.target.value)}
                                className="bg-background/50 border-primary/20"
                            />

                            <div className="rounded-xl border border-dashed border-primary/20 p-3 space-y-3">
                                <div className="flex flex-wrap gap-2">
                                    {selectedUsers.length === 0 ? (
                                        <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/40 p-1">Nenhum aluno selecionado</span>
                                    ) : (
                                        selectedUsers.map((user) => (
                                            <span key={user.uid} className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-[10px] font-bold text-foreground">
                                                {user.name}
                                                <button onClick={() => toggleUserSelection(user.uid)} className="hover:text-primary transition-colors">
                                                    <X className="size-3" />
                                                </button>
                                            </span>
                                        ))
                                    )}
                                </div>

                                {suggestedUsers.length > 0 && (
                                    <div className="space-y-1 pt-2 border-t border-primary/5">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 mb-2">Sugestões</p>
                                        {suggestedUsers.map((user) => (
                                            <button
                                                key={user.uid}
                                                type="button"
                                                onClick={() => toggleUserSelection(user.uid)}
                                                className="flex w-full items-center justify-between p-2 rounded-lg hover:bg-primary/5 transition-colors text-left"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                                                        {user.name?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold leading-none">{user.name}</p>
                                                        <p className="text-[10px] text-muted-foreground leading-tight">{user.email}</p>
                                                    </div>
                                                </div>
                                                <span className="text-[10px] font-bold text-primary opacity-0 group-hover:opacity-100 uppercase tracking-widest">+ Add</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-2 pt-4">
                            <Button onClick={onSubmit} disabled={localCreating} className="flex-1 shadow-lg shadow-primary/10">
                                {localCreating ? (isEditing ? "Salvando..." : "Criando...") : (isEditing ? "Salvar Alterações" : "Criar Módulo")}
                            </Button>
                            <Button variant="outline" onClick={resetForm} disabled={localCreating}>
                                Cancelar
                            </Button>
                        </div>
                    </CardContent>
                    </Card>
                ) : null}

                {/* List Card */}
                <Card className="border-primary/20 bg-card/20 backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-base font-bold">Módulos Estruturados</CardTitle>
                            <p className="text-xs text-muted-foreground leading-relaxed">Gerencie a sequência de entrega do curso.</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => void loadTracks(true)} disabled={loading.tracks} className="text-[10px] font-bold uppercase tracking-widest">
                            Atualizar
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {loading.tracks ? (
                                <div className="h-32 flex items-center justify-center text-muted-foreground animate-pulse text-xs uppercase tracking-widest">Carregando módulos...</div>
                            ) : tracks.length === 0 ? (
                                <div className="h-32 flex items-center justify-center text-muted-foreground/40 border border-dashed border-primary/5 rounded-2xl text-[10px] uppercase font-bold tracking-widest">Nenhum módulo encontrado</div>
                            ) : (
                                <>
                                    <div className="grid gap-2 sm:grid-cols-3">
                                        <div className="rounded-xl border border-primary/10 bg-primary/5 p-3">
                                            <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60">Módulos</p>
                                            <p className="text-lg font-bold text-foreground">{tracksOrdered.length}</p>
                                        </div>
                                        <div className="rounded-xl border border-primary/10 bg-primary/5 p-3">
                                            <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60">Com alunos</p>
                                            <p className="text-lg font-bold text-foreground">{tracksOrdered.filter((track) => (track.userIds?.length ?? 0) > 0).length}</p>
                                        </div>
                                        <div className="rounded-xl border border-primary/10 bg-primary/5 p-3">
                                            <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60">Alunos vinculados</p>
                                            <p className="text-lg font-bold text-foreground">{tracksOrdered.reduce((acc, track) => acc + (track.userIds?.length ?? 0), 0)}</p>
                                        </div>
                                    </div>

                                    <div className="rounded-xl border border-primary/10 bg-background/70 p-3 space-y-3">
                                        <div className="space-y-1">
                                            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Módulo selecionado</Label>
                                            <select
                                                value={selectedTrackId}
                                                onChange={(event) => setSelectedTrackId(event.target.value)}
                                                className="h-9 w-full rounded-md border border-primary/20 bg-background/80 px-3 text-xs font-semibold outline-none transition-all focus:border-primary/30"
                                            >
                                                {tracksOrdered.map((track) => (
                                                    <option key={track.id} value={track.id}>
                                                        Módulo {track.order || "-"} · {track.title}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {selectedTrack ? (
                                            <>
                                                <div className="rounded-xl border border-primary/10 bg-primary/5 p-3">
                                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                                        <div className="min-w-0">
                                                            <div className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">Módulo {selectedTrack.order || "-"}</div>
                                                            <p className="text-sm font-bold tracking-tight wrap-break-word">{selectedTrack.title}</p>
                                                            <p className="mt-1 text-[11px] text-muted-foreground/70 leading-relaxed wrap-break-word">
                                                                {selectedTrack.description || "Sem descrição disponível."}
                                                            </p>
                                                        </div>
                                                        <div className="flex gap-1 self-end sm:self-auto">
                                                            <Button
                                                                size="xs"
                                                                variant="outline"
                                                                onClick={() => {
                                                                    onRequestOpenCreatePanel()
                                                                    setEditingTrackId(selectedTrack.id)
                                                                    setForm({
                                                                        title: selectedTrack.title,
                                                                        description: selectedTrack.description || "",
                                                                        order: String(selectedTrack.order || ""),
                                                                        userIds: selectedTrack.userIds ?? [],
                                                                    })
                                                                }}
                                                            >
                                                                Editar
                                                            </Button>
                                                            <Button
                                                                size="icon-xs"
                                                                variant="ghost"
                                                                className="text-destructive/40 hover:text-destructive hover:bg-destructive/5"
                                                                onClick={() => handleDeleteTrack(selectedTrack)}
                                                                aria-label="Excluir módulo selecionado"
                                                            >
                                                                <X className="size-3" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="inline-flex items-center gap-1 rounded-xl border border-primary/15 bg-primary/5 p-1">
                                                    {[
                                                        { id: "overview", label: "Visão geral" },
                                                        { id: "students", label: "Alunos" },
                                                    ].map((tab) => (
                                                        <Button
                                                            key={tab.id}
                                                            type="button"
                                                            size="xs"
                                                            variant={trackTab === tab.id ? "default" : "ghost"}
                                                            className="rounded-lg text-[10px] uppercase tracking-widest font-bold"
                                                            onClick={() => setTrackTab(tab.id as typeof trackTab)}
                                                        >
                                                            {tab.label}
                                                        </Button>
                                                    ))}
                                                </div>

                                                {trackTab === "overview" ? (
                                                    <div className="grid gap-2 sm:grid-cols-2">
                                                        <div className="rounded-lg border border-primary/10 bg-background/80 p-2">
                                                            <div className="flex items-center gap-1.5 text-muted-foreground/60">
                                                                <Users2 className="size-3" />
                                                                <p className="text-[10px] uppercase font-bold tracking-widest">Alunos vinculados</p>
                                                            </div>
                                                            <p className="mt-1 text-sm font-bold text-foreground">{selectedTrack.userIds?.length || 0}</p>
                                                        </div>
                                                        <div className="rounded-lg border border-primary/10 bg-background/80 p-2">
                                                            <div className="flex items-center gap-1.5 text-muted-foreground/60">
                                                                <ClipboardList className="size-3" />
                                                                <p className="text-[10px] uppercase font-bold tracking-widest">Status</p>
                                                            </div>
                                                            <p className="mt-1 text-sm font-bold text-foreground">OK</p>
                                                        </div>
                                                    </div>
                                                ) : null}

                                                {trackTab === "students" ? (
                                                    selectedTrackStudents.length > 0 ? (
                                                        <div className="space-y-2">
                                                            {selectedTrackStudents.map((user) => (
                                                                <div key={user.uid} className="rounded-lg border border-primary/10 bg-background/80 px-2 py-1.5">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="size-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                                                                            {user.name?.charAt(0) || user.email?.charAt(0) || "U"}
                                                                        </div>
                                                                        <div className="min-w-0">
                                                                            <p className="text-xs font-semibold truncate">{user.name || "Sem nome"}</p>
                                                                            <p className="text-[10px] text-muted-foreground truncate">{user.email || "Sem email"}</p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="text-[11px] text-muted-foreground/70">Sem alunos vinculados neste módulo.</p>
                                                    )
                                                ) : null}
                                            </>
                                        ) : (
                                            <p className="text-[11px] text-muted-foreground/70">Selecione um módulo para visualizar detalhes.</p>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
