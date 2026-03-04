"use client"

import * as React from "react"
import { Calendar, CheckCircle2, Clock3, Globe2, Lock, Users } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type ScheduleMode = "now" | "scheduled"
type Visibility = "module" | "users" | "private"

type VisibilityOption = {
  value: Visibility
  label: string
  description?: string
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
  { value: "now", label: "Publicar Agora" },
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
    {
      value: "module",
      label: "Publico do Modulo",
      description: "Todos os alunos do modulo podem acessar.",
      icon: Globe2,
    },
    {
      value: "users",
      label: "Apenas Alunos Selecionados",
      description: "Liberacao individual por aluno.",
      icon: Users,
    },
    {
      value: "private",
      label: "Privado (Rascunho)",
      description: "So administradores visualizam.",
      icon: Lock,
    },
  ]

  const opts = visibilityOptions || defaultVisibilityOpts
  const visibilityLabel = opts.find((opt) => opt.value === visibility)?.label ?? visibility
  const scheduleLabel = scheduleMode === "scheduled" ? "Agendado" : "Imediato"

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-primary/15 bg-background/40 p-3">
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 font-semibold text-primary">
            <CheckCircle2 className="size-3" /> Acesso: {visibilityLabel}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-background px-2 py-0.5 font-medium text-muted-foreground">
            <Clock3 className="size-3" /> Liberacao: {scheduleLabel}
          </span>
          {scheduleMode === "scheduled" && releaseAt ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-background px-2 py-0.5 font-medium text-muted-foreground">
              <Calendar className="size-3" /> {new Date(releaseAt).toLocaleString("pt-BR")}
            </span>
          ) : null}
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60">
          1. Quem pode acessar
        </Label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {opts.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onVisibilityChange(opt.value)}
              className={`rounded-xl border p-3 text-left transition-all ${
                visibility === opt.value
                  ? "border-primary bg-primary/10 shadow-sm shadow-primary/10"
                  : "border-primary/20 bg-background/70 hover:border-primary/40 hover:bg-primary/5"
              }`}
            >
              <div className="mb-2 flex items-center gap-2">
                {opt.icon ? (
                  <span
                    className={`inline-flex size-7 items-center justify-center rounded-lg ${
                      visibility === opt.value ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
                    }`}
                  >
                    <opt.icon className="h-4 w-4" />
                  </span>
                ) : null}
                <span
                  className={`text-[11px] font-bold uppercase tracking-wider ${
                    visibility === opt.value ? "text-primary" : "text-foreground"
                  }`}
                >
                  {opt.label}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{opt.description ?? "Sem descricao."}</p>
            </button>
          ))}
        </div>
      </div>

      {children ? (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="space-y-2">
            <Label className="text-[11px] font-bold uppercase tracking-wider text-primary/70">
              2. Definir restricao
            </Label>
            <div className="rounded-xl border border-primary/15 bg-background/50 p-3">{children}</div>
          </div>
        </div>
      ) : null}

      <div className="space-y-3 border-t border-primary/5 pt-4">
        <Label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60">
          <Calendar className="h-3.5 w-3.5" /> 3. Quando liberar
        </Label>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex h-9 shrink-0 rounded-lg border border-primary/20 bg-background/50 p-1">
            {DEFAULT_SCHEDULE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onScheduleModeChange(opt.value)}
                className={`flex items-center justify-center rounded-md px-3.5 py-1 text-[11px] font-bold uppercase tracking-widest transition-all ${
                  scheduleMode === opt.value
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-primary/5 hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              scheduleMode === "scheduled" ? "w-full max-w-64 opacity-100" : "w-0 opacity-0"
            }`}
          >
            <Input
              type="datetime-local"
              value={releaseAt}
              onChange={(e) => onReleaseAtChange(e.target.value)}
              className="h-9 border-primary/20 bg-background/50 text-xs focus-visible:ring-1 focus-visible:ring-primary/20"
              disabled={scheduleMode !== "scheduled"}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
