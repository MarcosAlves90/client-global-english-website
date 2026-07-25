"use client"

import * as React from "react"
import { ChevronDown, Copy, Eye, Loader2, Target, Trash2, X } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Input } from "@/components/ui/input"
import { ACTIVITY_TYPE_LABELS } from "./constants"
import type { Activity, AdminActivityResponse, Track } from "@/lib/firebase/types"

type ActivityInsightsTab = "overview" | "responses" | "questions" | "attachments"

const INSIGHTS_TABS: Array<{ id: ActivityInsightsTab; label: string }> = [
    { id: "overview", label: "Visao geral" },
    { id: "responses", label: "Respostas" },
    { id: "questions", label: "Questoes" },
    { id: "attachments", label: "Anexos" },
]

type ActivityInsightsPanelProps = Readonly<{
    loading: { activities: boolean; responses: boolean }
    activities: Activity[]
    tracks: Track[]
    activityResponses: AdminActivityResponse[]
    onDeleteActivity: (activity: Activity) => void
    onDeleteActivityAttachment: (activityId: string, attachmentUrl: string) => void
    onCopyAttachmentLink: (url: string) => Promise<void>
}>

function formatDateTime(value: Date | string | null | undefined) {
    if (!value) return "Sem data"
    const parsed = value instanceof Date ? value : new Date(value)
    if (Number.isNaN(parsed.getTime())) return "Sem data"
    return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(parsed)
}

function formatAnswerValue(value: string | string[] | boolean | null | undefined) {
    if (Array.isArray(value)) return value.length ? value.join(", ") : "Sem resposta"
    if (typeof value === "boolean") return value ? "Verdadeiro" : "Falso"
    if (typeof value === "string") return value.trim() || "Sem resposta"
    return "Sem resposta"
}

function getActivityTypeLabel(type: Activity["type"]) {
    return ACTIVITY_TYPE_LABELS[type]
}

function buildTrackMap(tracks: Track[]) {
    return new Map(tracks.map((track) => [track.id, track] as const))
}

function sortActivities(activities: Activity[], trackById: Map<string, Track>) {
    return [...activities].sort((a, b) => {
        const left = trackById.get(a.trackId)?.order ?? 0
        const right = trackById.get(b.trackId)?.order ?? 0
        if (left !== right) return left - right
        return (a.title ?? "").localeCompare(b.title ?? "")
    })
}

function getResponsesForActivity(activityId: string | null, activityResponses: AdminActivityResponse[]) {
    if (!activityId) return []
    return activityResponses.filter((response) => response.activityId === activityId)
}

function getAverageScore(responses: AdminActivityResponse[]) {
    const completed = responses.filter((item) => item.status === "completed")
    if (!completed.length) return null
    return Math.round(completed.reduce((acc, item) => acc + (item.scorePercent ?? 0), 0) / completed.length)
}

function getResponseCompletionPercent(responses: AdminActivityResponse[]) {
    if (responses.length === 0) return "0%"
    const completed = responses.filter((item) => item.status === "completed").length
    return `${Math.round((completed / responses.length) * 100)}%`
}

export function ActivityInsightsPanel({
    loading,
    activities,
    tracks,
    activityResponses,
    onDeleteActivity,
    onDeleteActivityAttachment,
    onCopyAttachmentLink,
}: ActivityInsightsPanelProps) {
    const [selectedActivityId, setSelectedActivityId] = React.useState("")
    const [insightsTab, setInsightsTab] = React.useState<ActivityInsightsTab>("overview")
    const [responseSearch, setResponseSearch] = React.useState("")
    const [expandedResponseId, setExpandedResponseId] = React.useState<string | null>(null)

    const trackById = React.useMemo(() => buildTrackMap(tracks), [tracks])
    const activitiesOrdered = React.useMemo(() => sortActivities(activities, trackById), [activities, trackById])

    React.useEffect(() => {
        if (!activitiesOrdered.length) {
            setSelectedActivityId("")
            return
        }

        const hasSelectedActivity = activitiesOrdered.some((activity) => activity.id === selectedActivityId)
        if (!hasSelectedActivity) {
            setSelectedActivityId(activitiesOrdered[0]?.id ?? "")
        }
    }, [activitiesOrdered, selectedActivityId])

    React.useEffect(() => {
        setResponseSearch("")
        setExpandedResponseId(null)
        setInsightsTab("overview")
    }, [selectedActivityId])

    const selectedActivity = React.useMemo(() => {
        return activitiesOrdered.find((activity) => activity.id === selectedActivityId) ?? null
    }, [activitiesOrdered, selectedActivityId])

    const selectedQuestions = React.useMemo(() => {
        return selectedActivity && Array.isArray(selectedActivity.questions) ? selectedActivity.questions : []
    }, [selectedActivity])

    const selectedResponses = React.useMemo(() => {
        return getResponsesForActivity(selectedActivity?.id ?? null, activityResponses)
    }, [activityResponses, selectedActivity?.id])

    const filteredSelectedResponses = React.useMemo(() => {
        const query = responseSearch.trim().toLowerCase()
        if (!query) return selectedResponses

        return selectedResponses.filter((response) => {
            const name = response.user?.name?.toLowerCase() ?? ""
            const email = response.user?.email?.toLowerCase() ?? ""
            const uid = response.userId.toLowerCase()
            return name.includes(query) || email.includes(query) || uid.includes(query)
        })
    }, [responseSearch, selectedResponses])

    const averageScore = getAverageScore(selectedResponses)

    return (
        <Card className="h-fit overflow-hidden border-primary/20 bg-card/20 backdrop-blur-sm lg:sticky lg:top-6">
            <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex flex-col">
                    <CardTitle className="text-base font-bold">Banco de Atividades</CardTitle>
                    <div className="mt-1 flex items-center gap-2">
                        <Target className="size-3 text-primary/40" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            {activities.length} exercicios
                        </span>
                    </div>
                </div>
                <Button variant="ghost" size="xs" disabled={loading.activities} className="text-[10px] font-bold uppercase tracking-widest">
                    Atualizar
                </Button>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {loading.activities ? (
                        <LoadingState label="Sincronizando..." />
                    ) : tracks.length === 0 || activities.length === 0 ? (
                        <EmptyState label="Aguardando novos desafios..." />
                    ) : (
                        <ActivityInsightsBody
                            selectedActivity={selectedActivity}
                            selectedQuestions={selectedQuestions}
                            selectedResponses={selectedResponses}
                            filteredSelectedResponses={filteredSelectedResponses}
                            averageScore={averageScore}
                            loadingResponses={loading.responses}
                            insightsTab={insightsTab}
                            onInsightsTabChange={setInsightsTab}
                            responseSearch={responseSearch}
                            onResponseSearchChange={setResponseSearch}
                            expandedResponseId={expandedResponseId}
                            onExpandedResponseIdChange={setExpandedResponseId}
                            onDeleteActivity={onDeleteActivity}
                            onDeleteActivityAttachment={onDeleteActivityAttachment}
                            onCopyAttachmentLink={onCopyAttachmentLink}
                        />
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

type ActivityInsightsBodyProps = Readonly<{
    selectedActivity: Activity | null
    selectedQuestions: NonNullable<Activity["questions"]>
    selectedResponses: AdminActivityResponse[]
    filteredSelectedResponses: AdminActivityResponse[]
    averageScore: number | null
    loadingResponses: boolean
    insightsTab: ActivityInsightsTab
    onInsightsTabChange: (value: ActivityInsightsTab) => void
    responseSearch: string
    onResponseSearchChange: (value: string) => void
    expandedResponseId: string | null
    onExpandedResponseIdChange: (value: string | null) => void
    onDeleteActivity: (activity: Activity) => void
    onDeleteActivityAttachment: (activityId: string, attachmentUrl: string) => void
    onCopyAttachmentLink: (url: string) => Promise<void>
}>

function ActivityInsightsBody({
    selectedActivity,
    selectedQuestions,
    selectedResponses,
    filteredSelectedResponses,
    averageScore,
    loadingResponses,
    insightsTab,
    onInsightsTabChange,
    responseSearch,
    onResponseSearchChange,
    expandedResponseId,
    onExpandedResponseIdChange,
    onDeleteActivity,
    onDeleteActivityAttachment,
    onCopyAttachmentLink,
}: ActivityInsightsBodyProps) {
    if (!selectedActivity) {
        return <EmptyState label="Selecione uma atividade para visualizar detalhes." />
    }

    return (
        <div className="space-y-3">
            <ActivityHeader
                selectedActivity={selectedActivity}
                selectedQuestions={selectedQuestions}
                selectedResponses={selectedResponses}
                onDeleteActivity={onDeleteActivity}
            />
            <ActivityTabBar insightsTab={insightsTab} onInsightsTabChange={onInsightsTabChange} />
            <ActivityMetrics selectedResponses={selectedResponses} averageScore={averageScore} />
            {insightsTab === "overview" ? (
                <OverviewPanel
                    responseSearch={responseSearch}
                    onResponseSearchChange={onResponseSearchChange}
                    selectedResponses={selectedResponses}
                    averageScore={averageScore}
                />
            ) : null}
            {insightsTab === "responses" ? (
                <ResponsesPanel
                    loadingResponses={loadingResponses}
                    responseSearch={responseSearch}
                    onResponseSearchChange={onResponseSearchChange}
                    filteredSelectedResponses={filteredSelectedResponses}
                    selectedQuestions={selectedQuestions}
                    expandedResponseId={expandedResponseId}
                    onExpandedResponseIdChange={onExpandedResponseIdChange}
                />
            ) : null}
            {insightsTab === "questions" ? <QuestionsPanel selectedActivity={selectedActivity} selectedQuestions={selectedQuestions} /> : null}
            {insightsTab === "attachments" ? (
                <AttachmentsPanel
                    selectedActivity={selectedActivity}
                    onDeleteActivityAttachment={onDeleteActivityAttachment}
                    onCopyAttachmentLink={onCopyAttachmentLink}
                />
            ) : null}
        </div>
    )
}

function ActivityHeader({
    selectedActivity,
    selectedQuestions,
    selectedResponses,
    onDeleteActivity,
}: Readonly<{
    selectedActivity: Activity
    selectedQuestions: NonNullable<Activity["questions"]>
    selectedResponses: AdminActivityResponse[]
    onDeleteActivity: (activity: Activity) => void
}>) {
    return (
        <div className="rounded-xl border border-primary/10 bg-primary/5 p-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                    <p className="wrap-break-word text-sm font-bold leading-tight">{selectedActivity.title}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 font-semibold uppercase text-primary">
                            {getActivityTypeLabel(selectedActivity.type)}
                        </span>
                        <span>{selectedQuestions.length} questao(oes)</span>
                        <span>{selectedResponses.length} resposta(s)</span>
                        <span>{selectedActivity.estimatedMinutes || 0} min</span>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => onDeleteActivity(selectedActivity)}
                    className="text-destructive/60 hover:text-destructive"
                    aria-label="Excluir atividade selecionada"
                >
                    <X className="size-3" />
                </Button>
            </div>
        </div>
    )
}

function ActivityTabBar({
    insightsTab,
    onInsightsTabChange,
}: Readonly<{
    insightsTab: ActivityInsightsTab
    onInsightsTabChange: (value: ActivityInsightsTab) => void
}>) {
    return (
        <div className="inline-flex items-center gap-1 rounded-xl border border-primary/15 bg-primary/5 p-1">
            {INSIGHTS_TABS.map((tab) => (
                <Button
                    key={tab.id}
                    type="button"
                    size="xs"
                    variant={insightsTab === tab.id ? "default" : "ghost"}
                    className="rounded-lg text-[10px] font-bold uppercase tracking-widest"
                    onClick={() => onInsightsTabChange(tab.id)}
                >
                    {tab.label}
                </Button>
            ))}
        </div>
    )
}

function ActivityMetrics({
    selectedResponses,
    averageScore,
}: Readonly<{
    selectedResponses: AdminActivityResponse[]
    averageScore: number | null
}>) {
    return (
        <div className="grid gap-2 sm:grid-cols-3">
            <MetricCard label="Respostas" value={selectedResponses.length} />
            <MetricCard label="Taxa de conclusao" value={getResponseCompletionPercent(selectedResponses)} />
            <MetricCard label="Media da atividade" value={averageScore === null ? "N/A" : `${averageScore}%`} />
        </div>
    )
}

function MetricCard({ label, value }: Readonly<{ label: string; value: number | string }>) {
    return (
        <div className="rounded-lg border border-primary/10 bg-background/80 p-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{label}</p>
            <p className="text-sm font-bold text-foreground">{value}</p>
        </div>
    )
}

function OverviewPanel({
    responseSearch,
    onResponseSearchChange,
    selectedResponses,
    averageScore,
}: Readonly<{
    responseSearch: string
    onResponseSearchChange: (value: string) => void
    selectedResponses: AdminActivityResponse[]
    averageScore: number | null
}>) {
    return (
        <div className="space-y-2">
            <Input
                placeholder="Buscar aluno por nome, email ou UID..."
                value={responseSearch}
                onChange={(event) => onResponseSearchChange(event.target.value)}
                className="border-primary/20 bg-background/80"
            />
            <div className="grid gap-2 sm:grid-cols-3">
                <MetricCard label="Respostas" value={selectedResponses.length} />
                <MetricCard label="Taxa de conclusao" value={getResponseCompletionPercent(selectedResponses)} />
                <MetricCard label="Media da atividade" value={averageScore === null ? "N/A" : `${averageScore}%`} />
            </div>
        </div>
    )
}

function ResponsesPanel({
    loadingResponses,
    responseSearch,
    onResponseSearchChange,
    filteredSelectedResponses,
    selectedQuestions,
    expandedResponseId,
    onExpandedResponseIdChange,
}: Readonly<{
    loadingResponses: boolean
    responseSearch: string
    onResponseSearchChange: (value: string) => void
    filteredSelectedResponses: AdminActivityResponse[]
    selectedQuestions: NonNullable<Activity["questions"]>
    expandedResponseId: string | null
    onExpandedResponseIdChange: (value: string | null) => void
}>) {
    return (
        <div className="space-y-2">
            <Input
                placeholder="Buscar aluno por nome, email ou UID..."
                value={responseSearch}
                onChange={(event) => onResponseSearchChange(event.target.value)}
                className="border-primary/20 bg-background/80"
            />

            {loadingResponses ? (
                <LoadingState label="Carregando respostas..." />
            ) : filteredSelectedResponses.length === 0 ? (
                <EmptyState label="Nenhuma resposta encontrada para os filtros atuais." />
            ) : (
                <div className="space-y-2">
                    {filteredSelectedResponses.map((response) => (
                        <ResponseItem
                            key={response.id}
                            response={response}
                            selectedQuestions={selectedQuestions}
                            expanded={expandedResponseId === response.id}
                            onExpandedChange={(open) => onExpandedResponseIdChange(open ? response.id : null)}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

function ResponseItem({
    response,
    selectedQuestions,
    expanded,
    onExpandedChange,
}: Readonly<{
    response: AdminActivityResponse
    selectedQuestions: NonNullable<Activity["questions"]>
    expanded: boolean
    onExpandedChange: (open: boolean) => void
}>) {
    const userLabel = response.user?.name || response.user?.email || response.userId
    const answersEntries = Object.entries(response.answers ?? {})

    return (
        <Collapsible open={expanded} onOpenChange={onExpandedChange} className="rounded-lg border border-primary/10 bg-background/80 p-2">
            <CollapsibleTrigger asChild>
                <Button variant="ghost" type="button" className="group flex h-auto w-full items-center justify-between px-1 py-1.5">
                    <div className="flex min-w-0 items-center gap-2 text-left">
                        <Avatar size="sm" className="size-7 border border-primary/20">
                            <AvatarImage src={response.user?.photoURL || undefined} alt={response.user?.name || response.user?.email || "Usuario"} />
                            <AvatarFallback className="bg-primary/10 text-[10px] font-bold text-primary">
                                {(response.user?.name || response.user?.email || "U").slice(0, 1).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                            <p className="truncate text-xs font-semibold">{userLabel}</p>
                            <p className="text-[10px] text-muted-foreground">Atualizado em {formatDateTime(response.updatedAt)}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 text-[10px]">
                        <span className="rounded-full border border-primary/15 bg-primary/10 px-2 py-0.5 font-bold uppercase tracking-wider text-primary">
                            {response.status === "completed" ? "Concluida" : "Em andamento"}
                        </span>
                        <span className="rounded-full border border-primary/10 bg-background px-2 py-0.5 font-semibold text-muted-foreground">
                            {response.completionPercent}%
                        </span>
                        <ChevronDown className="size-3 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                    </div>
                </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1.5 pt-2">
                {renderResponseDetails(response, selectedQuestions, answersEntries)}
            </CollapsibleContent>
        </Collapsible>
    )
}

function renderResponseDetails(
    response: AdminActivityResponse,
    selectedQuestions: NonNullable<Activity["questions"]>,
    answersEntries: Array<[string, string | string[] | boolean | null | undefined]>,
) {
    if (answersEntries.length === 0) {
        return <EmptyState label="Sem respostas registradas." />
    }

    if (selectedQuestions.length > 0) {
        return (
            <div className="space-y-1.5">
                {selectedQuestions.map((question, questionIndex) => {
                    const questionKey = question.id || `q-${questionIndex + 1}`
                    const answer = response.answers?.[questionKey]

                    return (
                        <div key={`${response.id}-${questionKey}`} className="rounded-md border border-primary/10 bg-primary/5 px-2 py-1.5">
                            <p className="line-clamp-2 text-[10px] font-semibold text-muted-foreground">
                                {questionIndex + 1}. {question.prompt || "Questao sem enunciado"}
                            </p>
                            <p className="mt-1 wrap-break-word text-[11px] text-foreground/90">{formatAnswerValue(answer)}</p>
                        </div>
                    )
                })}
            </div>
        )
    }

    return (
        <div className="space-y-1.5">
            {answersEntries.map(([key, value]) => (
                <div key={`${response.id}-${key}`} className="rounded-md border border-primary/10 bg-primary/5 px-2 py-1.5">
                    <p className="text-[10px] font-semibold text-muted-foreground">{key}</p>
                    <p className="mt-1 wrap-break-word text-[11px] text-foreground/90">{formatAnswerValue(value)}</p>
                </div>
            ))}
        </div>
    )
}

function QuestionsPanel({
    selectedActivity,
    selectedQuestions,
}: Readonly<{
    selectedActivity: Activity
    selectedQuestions: NonNullable<Activity["questions"]>
}>) {
    if (selectedQuestions.length === 0) {
        return <EmptyState label="Sem questoes cadastradas nesta atividade." />
    }

    return (
        <div className="space-y-2">
            {selectedQuestions.map((question, questionIndex) => (
                <div key={question.id || `${selectedActivity.id}-${question.type}-${question.prompt}`} className="rounded-lg border border-primary/10 bg-background/80 p-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-[11px] font-semibold">Q{questionIndex + 1}</p>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 font-semibold uppercase text-primary">
                                {question.type?.replace("_", " ") || "questao"}
                            </span>
                            <span>{question.points ?? 0} pts</span>
                        </div>
                    </div>
                    <p className="mt-1 wrap-break-word text-xs text-foreground/90">{question.prompt || "Sem enunciado"}</p>
                </div>
            ))}
        </div>
    )
}

function AttachmentsPanel({
    selectedActivity,
    onDeleteActivityAttachment,
    onCopyAttachmentLink,
}: Readonly<{
    selectedActivity: Activity
    onDeleteActivityAttachment: (activityId: string, attachmentUrl: string) => void
    onCopyAttachmentLink: (url: string) => Promise<void>
}>) {
    const attachments = selectedActivity.attachments ?? []

    if (attachments.length === 0) {
        return <EmptyState label="Sem anexos nesta atividade." />
    }

    return (
        <div className="space-y-2">
            {attachments.map((attachment) => (
                <div key={attachment.url || `${selectedActivity.id}-${attachment.name || "attachment"}`} className="rounded-lg border border-primary/10 bg-background/80 px-2 py-1.5">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <p className="min-w-0 break-all text-[11px] font-medium">{attachment.name || "Anexo"}</p>
                        <div className="flex items-center gap-1 self-end sm:self-auto">
                            {attachment.url ? (
                                <>
                                    <a
                                        href={attachment.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex size-6 items-center justify-center rounded-md border border-primary/20 text-primary hover:bg-primary/10"
                                        aria-label={`Abrir anexo ${attachment.name || "selecionado"}`}
                                    >
                                        <Eye className="size-3" />
                                    </a>
                                    <Button
                                        variant="ghost"
                                        size="icon-xs"
                                        type="button"
                                        onClick={() => {
                                            void onCopyAttachmentLink(attachment.url)
                                        }}
                                        aria-label={`Copiar link ${attachment.name || "selecionado"}`}
                                    >
                                        <Copy className="size-3" />
                                    </Button>
                                </>
                            ) : null}
                            <Button
                                variant="ghost"
                                size="icon-xs"
                                type="button"
                                onClick={() => onDeleteActivityAttachment(selectedActivity.id, attachment.url)}
                                className="text-destructive/60 hover:text-destructive"
                                aria-label={`Excluir anexo ${attachment.name || "selecionado"}`}
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
        <div className="inline-flex items-center gap-1.5 rounded-lg border border-primary/10 bg-background/80 p-3 text-[11px] text-muted-foreground">
            <Loader2 className="size-3 animate-spin" />
            {label}
        </div>
    )
}

function EmptyState({ label }: Readonly<{ label: string }>) {
    return <p className="rounded-lg border border-dashed border-primary/10 px-2 py-3 text-[11px] text-muted-foreground/70">{label}</p>
}
