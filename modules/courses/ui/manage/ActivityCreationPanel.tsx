"use client"

import * as React from "react"
import { CheckCircle2, FileText, Plus, Target, Trash2, X } from "lucide-react"

import { AudioRecorder } from "@/components/media/audio-recorder"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect } from "@/components/ui/native-select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ReleaseControls } from "./ReleaseControls"
import { UserAssignmentPicker, type UserAssignmentOption } from "./UserAssignmentPicker"
import { AttachmentUploadQueue } from "./AttachmentUploadQueue"
import { ACTIVITY_QUESTION_TYPE_LABELS, ACTIVITY_QUESTION_TYPE_OPTIONS } from "@/lib/activities/questions"
import { ACTIVITY_TYPE_LABELS } from "./constants"
import type { ActivityForm } from "./CourseManagementContext"

type UploadFeedbackState = {
    status: "idle" | "uploading" | "success" | "error"
    message: string
}

export type ActivityValidationErrors = {
    trackId?: string
    title?: string
    estimatedMinutes?: string
    users?: string
    schedule?: string
}

type ActivityCreationPanelProps = Readonly<{
    showCreatePanel: boolean
    tracks: Array<{ id: string; title: string }>
    form: ActivityForm
    validationErrors: ActivityValidationErrors
    localCreating: boolean
    userSearch: string
    selectedUsers: UserAssignmentOption[]
    suggestedUsers: UserAssignmentOption[]
    uploadingIndices: Record<number, boolean>
    uploadFeedback: Record<number, UploadFeedbackState>
    uploadProgress: Record<number, number>
    onUserSearchChange: (value: string) => void
    onToggleUser: (uid: string) => void
    onFormChange: React.Dispatch<React.SetStateAction<ActivityForm>>
    onValidationErrorClear: (key: keyof ActivityValidationErrors) => void
    onAddQuestion: () => void
    onRemoveQuestion: (index: number) => void
    questionAudioUploading: Record<number, boolean>
    onQuestionAudioFile: (index: number, file: File) => void | Promise<void>
    onRemoveQuestionAudio: (index: number) => void | Promise<void>
    onAddFiles: (files: File[]) => Promise<void>
    onRetryUpload: (index: number, file: File) => Promise<void>
    onRemoveAttachment: (index: number) => Promise<void>
    onAttachmentTypeChange: (index: number, type: ActivityForm["attachments"][number]["type"]) => void
    onAttachmentNameChange: (index: number, name: string) => void
    onCopyAttachmentLink: (url: string) => Promise<void>
    onSubmit: () => Promise<void>
}>

function getQuestionOptions(question: ActivityForm["questions"][number]) {
    if (question.type === "true_false") return ["Verdadeiro", "Falso"]
    return question.options.length ? question.options : [""]
}

export function ActivityCreationPanel(props: ActivityCreationPanelProps) {
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
        onAddQuestion,
        onRemoveQuestion,
        questionAudioUploading,
        onQuestionAudioFile,
        onRemoveQuestionAudio,
        onAddFiles,
        onRetryUpload,
        onRemoveAttachment,
        onAttachmentTypeChange,
        onAttachmentNameChange,
        onCopyAttachmentLink,
        onSubmit,
    } = props

    if (!showCreatePanel) return null

    const updateQuestion = (
        questionIndex: number,
        updater: (question: ActivityForm["questions"][number]) => ActivityForm["questions"][number]
    ) => {
        onFormChange((p) => {
            const next = [...p.questions]
            next[questionIndex] = updater(next[questionIndex])
            return { ...p, questions: next }
        })
    }

    const appendQuestionOption = (questionIndex: number) => {
        updateQuestion(questionIndex, (question) => ({
            ...question,
            options: [...question.options, ""],
        }))
    }

    const toggleCorrectAnswer = (questionIndex: number, option: string, isCorrect: boolean) => {
        updateQuestion(questionIndex, (question) => {
            let corrected: string[]
            if (question.type === "single_choice" || question.type === "true_false") {
                corrected = [option]
            } else if (isCorrect) {
                corrected = question.correctAnswers.filter((answer) => answer !== option)
            } else {
                corrected = [...question.correctAnswers, option]
            }
            return { ...question, correctAnswers: corrected }
        })
    }

    const updateQuestionOption = (questionIndex: number, optionIndex: number, value: string) => {
        updateQuestion(questionIndex, (question) => {
            const options = [...question.options]
            options[optionIndex] = value
            return { ...question, options }
        })
    }

    const removeQuestionOption = (questionIndex: number, optionIndex: number) => {
        updateQuestion(questionIndex, (question) => ({
            ...question,
            options: question.options.filter((_, idx) => idx !== optionIndex),
        }))
    }



    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="text-base font-bold">Estrutura da Atividade</CardTitle>
                    <p className="text-xs text-muted-foreground leading-relaxed">Defina o tipo de exercício, tempo estimado e critérios.</p>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label required className="ge-kicker text-muted-foreground/70">Módulo de Destino</Label>
                            <NativeSelect
                                className={validationErrors.trackId ? "border-destructive/60" : undefined}
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
                            </NativeSelect>
                        </div>
                        <div className="space-y-2">
                            <Label required className="ge-kicker text-muted-foreground/70">Título</Label>
                            <Input
                                placeholder="Ex.: Simulação de Reunião"
                                value={form.title}
                                onChange={(e) => {
                                    const value = e.target.value
                                    onFormChange((p) => ({ ...p, title: value }))
                                    if (value.trim()) onValidationErrorClear("title")
                                }}
                                className={validationErrors.title ? "border-destructive/60" : undefined}
                            />
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                        <div className="space-y-2">
                            <Label required className="ge-kicker text-muted-foreground/70">Categoria</Label>
                            <NativeSelect
                                value={form.type}
                                onChange={(e) => onFormChange((p) => ({ ...p, type: e.target.value as ActivityForm["type"] }))}
                            >
                                {Object.entries(ACTIVITY_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                            </NativeSelect>
                        </div>
                        <div className="space-y-2">
                            <Label required className="ge-kicker text-muted-foreground/70">Duração (Min)</Label>
                            <Input
                                type="number"
                                placeholder="Ex.: 45"
                                value={form.estimatedMinutes}
                                onChange={(e) => {
                                    const value = e.target.value
                                    onFormChange((p) => ({ ...p, estimatedMinutes: value }))
                                    if (Number(value) > 0) onValidationErrorClear("estimatedMinutes")
                                }}
                                className={validationErrors.estimatedMinutes ? "border-destructive/60" : undefined}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="ge-kicker text-muted-foreground/70">Ordem na Trilha</Label>
                            <Input
                                type="number"
                                placeholder="Ex.: 2"
                                value={form.order}
                                onChange={(e) => onFormChange((p) => ({ ...p, order: e.target.value }))}
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

                    <div className="space-y-3 border-t border-border/60 pt-4">
                        <div className="flex items-center justify-between">
                            <Label className="ge-kicker text-muted-foreground/70">Questões e Critérios</Label>
                            <Button variant="ghost" size="xs" onClick={onAddQuestion} className="text-[10px] font-medium text-primary">
                                <Plus className="mr-1 size-3" /> Adicionar Questão
                            </Button>
                        </div>

                        <div className="space-y-4">
                            {form.questions.length === 0 ? (
                                <div className="ge-surface-muted p-12 text-center transition-colors hover:border-primary/20">
                                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/5">
                                        <FileText className="h-6 w-6 text-primary/40" />
                                    </div>
                                    <p className="text-xs font-medium text-muted-foreground/40">Nenhuma questão definida</p>
                                    <p className="mt-1 text-xs text-muted-foreground/30">Adicione questões para estruturar sua atividade</p>
                                    <Button variant="outline" size="sm" onClick={onAddQuestion} className="mt-4 text-[10px] font-medium">
                                        <Plus className="mr-2 h-3 w-3" /> Criar Primeira Questão
                                    </Button>
                                </div>
                            ) : (
                                form.questions.map((question, questionIndex) => (
                                    <Card key={question.id} className="ge-inset group relative gap-0 overflow-hidden py-0 transition-all hover:border-primary/30">
                                        <div className="absolute top-0 left-0 h-full w-1 bg-primary/40 group-hover:bg-primary transition-colors" />
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-black text-primary">
                                                    {questionIndex + 1}
                                                </div>
                                                <Badge variant="outline" className="h-5 border-primary/20 bg-primary/5 px-1.5 text-[9px] font-semibold  text-primary">
                                                    {ACTIVITY_QUESTION_TYPE_LABELS[question.type]}
                                                </Badge>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => onRemoveQuestion(questionIndex)}
                                                className="h-7 w-7 text-muted-foreground/50 hover:text-destructive"
                                                aria-label={`Excluir questão ${questionIndex + 1}`}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </CardHeader>

                                        <CardContent className="space-y-4 p-4 pt-2 pb-5">
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-medium text-muted-foreground/60">Enunciado da Questão</Label>
                                                <Textarea
                                                    className="min-h-20"
                                                    placeholder="Digite a pergunta de forma clara e objetiva..."
                                                    value={question.prompt}
                                                    onChange={(e) => onFormChange((p) => {
                                                        const next = [...p.questions]
                                                        next[questionIndex] = { ...next[questionIndex], prompt: e.target.value }
                                                        return { ...p, questions: next }
                                                    })}
                                                />
                                            </div>

                                            <div className="ge-surface-muted space-y-3 p-3">
                                                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                                    <div>
                                                        <p className="text-[10px] font-semibold text-foreground">Áudio da questão (opcional)</p>
                                                        <p className="text-[10px] text-muted-foreground">Grave uma pronúncia, instrução ou referência para esta questão.</p>
                                                    </div>
                                                    {question.promptAudio?.url ? (
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="xs"
                                                            disabled={questionAudioUploading[questionIndex]}
                                                            onClick={() => void onRemoveQuestionAudio(questionIndex)}
                                                            className="text-destructive"
                                                        >
                                                            Remover áudio
                                                        </Button>
                                                    ) : null}
                                                </div>
                                                {question.promptAudio?.url ? (
                                                    <audio controls preload="metadata" src={question.promptAudio.url} className="h-9 max-w-full" />
                                                ) : null}
                                                <AudioRecorder
                                                    label={question.promptAudio?.url ? "Substituir gravação" : "Gravar orientação"}
                                                    disabled={questionAudioUploading[questionIndex]}
                                                    onAudioReady={(file) => onQuestionAudioFile(questionIndex, file)}
                                                />
                                            </div>

                                            <div className="grid gap-4 sm:grid-cols-2">
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] font-medium text-muted-foreground/60">Formato de Resposta</Label>
                                                    <NativeSelect
                                                        className="h-9 text-xs font-medium"
                                                        value={question.type}
                                                        onChange={(e) => onFormChange((p) => {
                                                            const next = [...p.questions]
                                                            next[questionIndex] = { ...next[questionIndex], type: e.target.value as ActivityForm["questions"][number]["type"] }
                                                            return { ...p, questions: next }
                                                        })}
                                                    >
                                                        {ACTIVITY_QUESTION_TYPE_OPTIONS.map((option) => {
                                                            const automatic = option.value === "single_choice" || option.value === "multiple_choice" || option.value === "true_false"
                                                            return (
                                                                <option key={option.value} value={option.value}>
                                                                    {option.label} · correção {automatic ? "automática" : "manual"}
                                                                </option>
                                                            )
                                                        })}
                                                    </NativeSelect>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] font-medium text-muted-foreground/60 flex items-center gap-1.5">
                                                        Pontuação
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <span><CheckCircle2 className="h-3 w-3 text-muted-foreground/40" /></span>
                                                                </TooltipTrigger>
                                                                <TooltipContent className="text-[10px]">Peso desta questão no cálculo da nota final</TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    </Label>
                                                    <div className="relative">
                                                        <Input
                                                            type="number"
                                                            value={question.points}
                                                            onChange={(e) => onFormChange((p) => {
                                                                const next = [...p.questions]
                                                                next[questionIndex] = { ...next[questionIndex], points: e.target.value }
                                                                return { ...p, questions: next }
                                                            })}
                                                            className="h-9 pl-8 text-xs font-semibold"
                                                        />
                                                        <Target className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground/30" />
                                                    </div>
                                                </div>
                                            </div>

                                            {question.type === "audio_response" ? (
                                                <div className="rounded-2xl border border-primary/15 bg-primary/5 p-3 text-[10px] leading-relaxed text-muted-foreground">
                                                    O aluno deverá gravar ou enviar um áudio para responder. Essa questão não recebe nota automática e fica disponível para correção do professor.
                                                </div>
                                            ) : null}

                                            {question.type === "single_choice" || question.type === "multiple_choice" || question.type === "true_false" ? (
                                                <div className="ge-surface-muted mt-4 space-y-3 p-4">
                                                    <div className="flex items-center justify-between">
                                                        <Label className="text-[10px] font-medium text-primary/70">Opções e Gabarito</Label>
                                                        {question.type === "true_false" ? null : (
                                                            <Button
                                                                variant="ghost"
                                                                size="xs"
                                                                onClick={() => appendQuestionOption(questionIndex)}
                                                                className="h-6 text-[9px] font-medium text-primary hover:bg-primary/10"
                                                            >
                                                                <Plus className="mr-1 h-3 w-3" /> Adicionar Opção
                                                            </Button>
                                                        )}
                                                    </div>

                                                    <div className="space-y-2">
                                                        {getQuestionOptions(question).map((option, optionIndex) => {
                                                            const isCorrect = question.correctAnswers.includes(option)
                                                            return (
                                                                <div key={`${question.id || question.prompt || question.type}-${option || "empty"}`} className="group/opt flex items-center gap-2">
                                                                    <button
                                                                        onClick={() => toggleCorrectAnswer(questionIndex, option, isCorrect)}
                                                                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-all ${isCorrect ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-500 shadow-sm shadow-emerald-500/20" : "border-border/70 bg-background/60 text-muted-foreground/50 hover:border-emerald-500/30 hover:text-emerald-500/70"}`}
                                                                    >
                                                                        {isCorrect ? <CheckCircle2 className="h-4 w-4" /> : <X className="h-4 w-4" />}
                                                                    </button>

                                                                    <div className="relative flex-1">
                                                                        <Input
                                                                            placeholder={`Texto da opção ${optionIndex + 1}`}
                                                                            value={option}
                                                                            readOnly={question.type === "true_false"}
                                                                            onChange={(e) => updateQuestionOption(questionIndex, optionIndex, e.target.value)}
                                                                            className={`h-8 pr-10 text-xs transition-all ${isCorrect ? "border-emerald-500/20 bg-emerald-500/5 font-medium" : "border-border/70 bg-background/60"}`}
                                                                        />
                                                                        {question.type === "true_false" ? null : (
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                onClick={() => removeQuestionOption(questionIndex, optionIndex)}
                                                                                className="absolute right-1 top-1 h-6 w-6 text-muted-foreground/20 hover:text-destructive opacity-0 group-hover/opt:opacity-100 transition-opacity"
                                                                            >
                                                                                <X className="h-3 w-3" />
                                                                            </Button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>

                                                    <p className="mt-2 flex items-center gap-1 text-[9px] font-medium text-emerald-500/60">
                                                        <CheckCircle2 className="h-3 w-3" /> Clique no círculo para definir as respostas corretas.
                                                    </p>
                                                </div>
                                            ) : null}
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-4">
                    <CardTitle className="text-base font-bold">Configurações de Acesso</CardTitle>
                    <p className="text-xs text-muted-foreground leading-relaxed">Defina quem e quando poderá acessar esta atividade.</p>
                </CardHeader>
                <CardContent className="space-y-6">
                    <ReleaseControls
                        visibility={form.visibility}
                        onVisibilityChange={(value) => {
                            onFormChange((p) => ({ ...p, visibility: value }))
                            if (value !== "users") onValidationErrorClear("users")
                        }}
                        scheduleMode={form.scheduleMode}
                        onScheduleModeChange={(mode) => onFormChange((p) => ({ ...p, scheduleMode: mode }))}
                        releaseAt={form.releaseAt}
                        onReleaseAtChange={(value) => onFormChange((p) => ({ ...p, releaseAt: value }))}
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

                    <div className="grid gap-4 border-t border-border/60 pt-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label className="ge-kicker text-muted-foreground/70">Prazo de entrega</Label>
                            <Input
                                type="datetime-local"
                                value={form.dueAt}
                                onChange={(event) => {
                                    onFormChange((current) => ({ ...current, dueAt: event.target.value }))
                                    onValidationErrorClear("schedule")
                                }}
                                className={validationErrors.schedule ? "border-destructive/60" : undefined}
                            />
                            <p className="text-[11px] text-muted-foreground">Após o prazo, a entrega fica marcada como atrasada.</p>
                        </div>
                        <div className="space-y-2">
                            <Label className="ge-kicker text-muted-foreground/70">Encerrar recebimento</Label>
                            <Input
                                type="datetime-local"
                                value={form.closeAt}
                                onChange={(event) => {
                                    onFormChange((current) => ({ ...current, closeAt: event.target.value }))
                                    onValidationErrorClear("schedule")
                                }}
                                className={validationErrors.schedule ? "border-destructive/60" : undefined}
                            />
                            <p className="text-[11px] text-muted-foreground">Depois desta data, novas alterações e envios são bloqueados.</p>
                        </div>
                    </div>

                    <div className="pt-2 flex flex-col gap-3">
                        {Object.values(validationErrors).some(Boolean) ? (
                            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive">
                                {Object.values(validationErrors)
                                    .filter((message): message is string => Boolean(message))
                                    .map((message, idx) => (
                                        <p key={`${message}-${idx}`}>{message}</p>
                                    ))}
                            </div>
                        ) : null}
                        <Button
                            onClick={() => void onSubmit()}
                            disabled={localCreating}
                            className="w-full h-10 bg-primary text-primary-foreground text-sm font-medium"
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
        </>
    )
}
