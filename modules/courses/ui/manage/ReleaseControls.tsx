"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar, Globe2, Lock, Users } from "lucide-react"

type ScheduleMode = "now" | "scheduled"
type Visibility = "module" | "users" | "private"

type VisibilityOption = {
    value: Visibility
    label: string
    icon?: React.ComponentType<{ className?: string }>
}

interface ReleaseControlsProps {
    visibility: Visibility
    visibilityOptions?: VisibilityOption[]
    onVisibilityChange: (value: Visibility) => void
    scheduleMode: ScheduleMode
    releaseAt: string
    onScheduleModeChange: (mode: ScheduleMode) => void
    onReleaseAtChange: (value: string) => void
    children?: React.ReactNode
}

const DEFAULT_SCHEDULE_OPTIONS: Array<{ value: ScheduleMode; label: string }> = [
    { value: "now", label: "Publicar Imediatamente" },
    { value: "scheduled", label: "Agendar" },
]

export function ReleaseControls(props: ReleaseControlsProps) {
    const {
        visibility,
        visibilityOptions,
        onVisibilityChange,
        scheduleMode,
        releaseAt,
        onScheduleModeChange,
        onReleaseAtChange,
        children,
    } = props

    const defaultVisibilityOpts: VisibilityOption[] = [
        { value: "module", label: "Público do Módulo", icon: Globe2 },
        { value: "users", label: "Específico (Alunos)", icon: Users },
        { value: "private", label: "Privado (Rascunho)", icon: Lock },
    ]

    const opts = visibilityOptions || defaultVisibilityOpts

    return (
        <div className="space-y-6">
            <div className="space-y-3">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60">
                    Visibilidade & Acesso
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {opts.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => onVisibilityChange(opt.value)}
                            className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-xs font-medium transition-colors ${
                                visibility === opt.value
                                    ? "bg-primary border-primary text-primary-foreground shadow-sm"
                                    : "bg-background border-primary/20 text-muted-foreground hover:bg-primary/5 hover:border-primary/30"
                            }`}
                        >
                            {opt.icon && <opt.icon className="h-4 w-4 shrink-0 transition-opacity opacity-80" />}
                            <span className="truncate">{opt.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {children && (
                <div className="pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="space-y-2">
                        <Label className="text-[11px] font-bold uppercase tracking-wider text-primary/60">
                            Selecionar Restrição
                        </Label>
                        {children}
                    </div>
                </div>
            )}

            <div className="space-y-3 pt-4 border-t border-primary/5">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" /> Cronograma de Liberação
                </Label>
                
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex h-9 rounded-lg border border-primary/20 bg-background/50 p-1 shrink-0">
                        {DEFAULT_SCHEDULE_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => onScheduleModeChange(opt.value)}
                                className={`flex items-center justify-center px-3.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-widest transition-all ${
                                    scheduleMode === opt.value 
                                    ? "bg-primary text-primary-foreground shadow-sm" 
                                    : "text-muted-foreground hover:text-foreground hover:bg-primary/5"
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>

                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${scheduleMode === "scheduled" ? "w-full max-w-55 opacity-100" : "w-0 opacity-0"}`}>
                        <Input
                            type="datetime-local"
                            value={releaseAt}
                            onChange={(e) => onReleaseAtChange(e.target.value)}
                            className="h-9 bg-background/50 border-primary/20 text-xs focus-visible:ring-1 focus-visible:ring-primary/20"
                            disabled={scheduleMode !== "scheduled"}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
