"use client"

import * as React from "react"
import { Calendar, CheckCircle2, Clock3, Globe2, Lock, Users } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

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

const DEFAULT_VISIBILITY_OPTIONS: VisibilityOption[] = [
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

const DEFAULT_SCHEDULE_OPTIONS: Array<{ value: ScheduleMode; label: string }> = [
  { value: "now", label: "Publicar Agora" },
  { value: "scheduled", label: "Agendar" },
]

export function ReleaseControls({
  visibility,
  visibilityOptions,
  onVisibilityChange,
  scheduleMode,
  releaseAt,
  onScheduleModeChange,
  onReleaseAtChange,
  children,
}: ReleaseControlsProps) {
  const options = visibilityOptions || DEFAULT_VISIBILITY_OPTIONS
  const visibilityLabel = options.find((option) => option.value === visibility)?.label ?? visibility
  const scheduleLabel = scheduleMode === "scheduled" ? "Agendado" : "Imediato"

  return (
    <div className="space-y-6">
      <div className="ge-surface-muted p-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="border-primary/20 bg-primary/10 text-primary">
            <CheckCircle2 className="size-3" />
            Acesso: {visibilityLabel}
          </Badge>
          <Badge variant="outline">
            <Clock3 className="size-3" />
            Liberacao: {scheduleLabel}
          </Badge>
          {scheduleMode === "scheduled" && releaseAt ? (
            <Badge variant="outline">
              <Calendar className="size-3" />
              {new Date(releaseAt).toLocaleString("pt-BR")}
            </Badge>
          ) : null}
        </div>
      </div>

      <div className="space-y-3">
        <Label className="ge-kicker text-muted-foreground/70">1. Quem pode acessar</Label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {options.map((option) => {
            const selected = visibility === option.value
            const Icon = option.icon

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onVisibilityChange(option.value)}
                aria-pressed={selected}
                className={cn(
                  "ge-inset p-3 text-left transition-all hover:border-primary/30 hover:bg-primary/5",
                  selected && "border-primary/35 bg-primary/10 shadow-sm shadow-primary/10"
                )}
              >
                <div className="mb-2 flex items-center gap-2">
                  {Icon ? (
                    <span
                      className={cn(
                        "ge-icon-tile size-8 rounded-full",
                        selected && "border-primary bg-primary text-primary-foreground"
                      )}
                    >
                      <Icon className="size-4" />
                    </span>
                  ) : null}
                  <span className={cn("text-xs font-semibold", selected ? "text-primary" : "text-foreground")}>
                    {option.label}
                  </span>
                </div>
                <p className="text-xs leading-5 text-muted-foreground">
                  {option.description ?? "Sem descricao."}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      {children ? (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="space-y-2">
            <Label className="ge-kicker">2. Definir restricao</Label>
            <div className="ge-inset p-3">{children}</div>
          </div>
        </div>
      ) : null}

      <div className="space-y-3 border-t border-border/60 pt-4">
        <Label className="ge-kicker flex items-center gap-1.5 text-muted-foreground/70">
          <Calendar className="size-3.5" />
          3. Quando liberar
        </Label>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="ge-segmented h-10 shrink-0">
            {DEFAULT_SCHEDULE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onScheduleModeChange(option.value)}
                aria-pressed={scheduleMode === option.value}
                className={cn(
                  "flex h-full items-center justify-center rounded-xl px-3.5 text-[11px] font-medium transition-all",
                  scheduleMode === option.value
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-primary/5 hover:text-foreground"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div
            className={cn(
              "overflow-hidden transition-all duration-300 ease-in-out",
              scheduleMode === "scheduled" ? "w-full max-w-64 opacity-100" : "w-0 opacity-0"
            )}
          >
            <Input
              type="datetime-local"
              value={releaseAt}
              onChange={(event) => onReleaseAtChange(event.target.value)}
              className="h-10 text-xs"
              disabled={scheduleMode !== "scheduled"}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
