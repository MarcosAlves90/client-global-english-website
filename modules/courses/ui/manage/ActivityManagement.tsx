"use client"

import * as React from "react"
import {
    Plus,
    Target,
    Trash2,
    X,
    FileText,
    GripVertical,
    CheckCircle2,
    Circle,
    Info,
    Users,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

export function ActivityManagement() {
    const {
        tracks,
        activities,
        availableUsers,
        loading,
        loadActivities,
        handleCreateActivity,
        handleDeleteActivity,
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
    }

    const onSubmit = async () => {
        setLocalCreating(true)
        await handleCreateActivity(form)
        setLocalCreating(false)
        resetForm()
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
                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60">Módulo de Destino</Label>
                                <select
                                    className="bg-background/50 text-foreground border-primary/20 h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs outline-none focus:border-primary/30"
                                    value={form.trackId}
                                    onChange={(e) => setForm((p) => ({ ...p, trackId: e.target.value }))}
                                >
                                    <option value="">Selecione um módulo</option>
                                    {tracks.map((track) => (
                                        <option key={track.id} value={track.id}>{track.title}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60">Título</Label>
                                <Input
                                    placeholder="Ex.: Simulação de Reunião"
                                    value={form.title}
                                    onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                                    className="bg-background/50 border-primary/20"
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-3">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60">Categoria</Label>
                                <select
                                    className="bg-background/50 text-foreground border-primary/20 h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs outline-none focus:border-primary/30"
                                    value={form.type}
                                    onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as ActivityForm["type"] }))}
                                >
                                    {Object.entries(ACTIVITY_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60">Duração (Min)</Label>
                                <Input
                                    type="number"
                                    placeholder="Ex.: 45"
                                    value={form.estimatedMinutes}
                                    onChange={(e) => setForm((p) => ({ ...p, estimatedMinutes: e.target.value }))}
                                    className="bg-background/50 border-primary/20"
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
                            onVisibilityChange={(value) => setForm((p) => ({ ...p, visibility: value }))}
                            scheduleMode={form.scheduleMode}
                            onScheduleModeChange={(mode) => setForm((p) => ({ ...p, scheduleMode: mode }))}
                            releaseAt={form.releaseAt}
                            onReleaseAtChange={(value) => setForm((p) => ({ ...p, releaseAt: value }))}
                        >
                            {form.visibility === "users" && (
                                <div className="space-y-3 p-3 rounded-xl border border-primary/20 bg-background/50">
                                    <div className="relative">
                                        <Input
                                            placeholder="Pesquisar alunos por nome..."
                                            value={userSearch}
                                            onChange={(e) => setUserSearch(e.target.value)}
                                            className="bg-background border-primary/20 text-xs h-9 pl-9"
                                        />
                                        <Users className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/40" />
                                    </div>
                                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                                        {selectedUsers.length === 0 ? (
                                            <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/40 text-center w-full py-4 bg-primary/5 rounded-lg">Selecione os alunos abaixo...</p>
                                        ) : (
                                            selectedUsers.map((u) => (
                                                <Badge key={u.uid} variant="secondary" className="flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                                                    <span className="text-[10px] font-bold">{u.name}</span>
                                                    <button onClick={() => toggleUserSelection(u.uid)} className="hover:text-destructive transition-colors">
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </Badge>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </ReleaseControls>

                        <div className="pt-2 flex flex-col gap-3">
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
            <Card className="border-primary/20 bg-card/20 backdrop-blur-sm h-fit sticky top-6">
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
                                    <div key={track.id} className="space-y-2">
                                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-500/60 border-b border-blue-500/10 pb-1 mb-3">{track.title}</p>
                                        {trackActivities.map(a => {
                                            const Icon = ACTIVITY_TYPE_ICONS[a.type as keyof typeof ACTIVITY_TYPE_ICONS] || FileText
                                            return (
                                                <div key={a.id} className="flex items-center justify-between p-3 rounded-2xl border border-primary/5 bg-primary/1 transition-all hover:bg-primary/5 hover:border-primary/20 group">
                                                    <div className="flex items-center gap-3">
                                                        <div className="size-8 rounded-xl bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                                            <Icon className="size-4 text-primary/60" />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold tracking-tight">{a.title}</p>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className="text-[9px] font-bold uppercase text-muted-foreground/40">{ACTIVITY_TYPE_LABELS[a.type as keyof typeof ACTIVITY_TYPE_LABELS]}</span>
                                                            <span className="text-[9px] font-bold uppercase text-muted-foreground/20">•</span>
                                                            <span className="text-[9px] font-medium text-muted-foreground/40">{a.estimatedMinutes || 0} min</span>
                                                        </div>
                                                    </div>
                                                    <Button variant="ghost" size="xs" onClick={() => handleDeleteActivity(a)} className="h-8 w-8 p-0 text-destructive/20 hover:text-destructive hover:bg-destructive/5 transition-all opacity-0 group-hover:opacity-100">
                                                        <X className="size-3" />
                                                    </Button>
                                                </div>
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
