"use client"

import * as React from "react"
import { Accessibility, Check, Contrast, RotateCcw, Type } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const STORAGE_KEY = "ge-accessibility-preferences"

type FontScale = "normal" | "large" | "xlarge"

type AccessibilityPreferences = {
  contrast: boolean
  fontScale: FontScale
}

const DEFAULT_PREFERENCES: AccessibilityPreferences = {
  contrast: false,
  fontScale: "normal",
}

const FONT_SCALE_OPTIONS: Array<{
  value: FontScale
  label: string
  percent: string
  sampleClassName: string
}> = [
  { value: "normal", label: "Texto padrão", percent: "100%", sampleClassName: "text-sm" },
  { value: "large", label: "Texto grande", percent: "110%", sampleClassName: "text-base" },
  { value: "xlarge", label: "Texto maior", percent: "120%", sampleClassName: "text-lg" },
]

function isFontScale(value: unknown): value is FontScale {
  return value === "normal" || value === "large" || value === "xlarge"
}

function readPreferences(): AccessibilityPreferences {
  if (globalThis.window === undefined) return DEFAULT_PREFERENCES

  const raw = globalThis.localStorage.getItem(STORAGE_KEY)
  if (!raw) return DEFAULT_PREFERENCES

  try {
    const parsed: unknown = JSON.parse(raw)
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "contrast" in parsed &&
      "fontScale" in parsed &&
      typeof (parsed as { contrast?: unknown }).contrast === "boolean" &&
      isFontScale((parsed as { fontScale?: unknown }).fontScale)
    ) {
      return {
        contrast: (parsed as { contrast: boolean }).contrast,
        fontScale: (parsed as { fontScale: FontScale }).fontScale,
      }
    }
  } catch {
    return DEFAULT_PREFERENCES
  }

  return DEFAULT_PREFERENCES
}

function applyPreferences(preferences: AccessibilityPreferences) {
  const root = document.documentElement

  if (preferences.contrast) root.dataset.contrast = "high"
  else delete root.dataset.contrast

  if (preferences.fontScale === "normal") delete root.dataset.fontScale
  else root.dataset.fontScale = preferences.fontScale
}

function persistPreferences(preferences: AccessibilityPreferences) {
  globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
}

export function AccessibilityMenu() {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [preferences, setPreferences] = React.useState(DEFAULT_PREFERENCES)
  const [hydrated, setHydrated] = React.useState(false)
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    const stored = readPreferences()
    setPreferences(stored)
    applyPreferences(stored)
    setHydrated(true)
  }, [])

  React.useEffect(() => {
    if (!hydrated) return
    applyPreferences(preferences)
    persistPreferences(preferences)
  }, [hydrated, preferences])

  React.useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: PointerEvent) => {
      if (containerRef.current?.contains(event.target as Node)) return
      setOpen(false)
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }

    document.addEventListener("pointerdown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [open])

  const isModified = preferences.contrast || preferences.fontScale !== "normal"

  return (
    <div
      ref={containerRef}
      className="fixed right-4 bottom-20 z-50 md:bottom-5"
    >
      {open ? (
        <div
          id="accessibility-preferences"
          role="dialog"
          aria-label="Preferências de acessibilidade"
          className="ge-accessibility-panel absolute right-0 bottom-full mb-3 w-[min(20rem,calc(100vw-2rem))] rounded-3xl border border-border/80 bg-popover/95 p-3 text-popover-foreground shadow-2xl shadow-black/20 backdrop-blur-2xl"
        >
          <div className="px-2 pt-1 pb-3">
            <div className="flex items-center gap-2">
              <div className="ge-icon-tile size-9 shrink-0">
                <Accessibility className="size-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold">Acessibilidade</h2>
                <p className="text-xs text-muted-foreground">Ajustes visuais sem alterar o layout.</p>
              </div>
            </div>
          </div>

          <button
            type="button"
            aria-pressed={preferences.contrast}
            aria-label={`Alto contraste ${preferences.contrast ? "ativo" : "inativo"}`}
            onClick={() =>
              setPreferences((current) => ({ ...current, contrast: !current.contrast }))
            }
            className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            <Contrast className="size-4.5 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium">Alto contraste</span>
              <span className="block text-xs text-muted-foreground">Aumenta separação entre fundo, texto e controles.</span>
            </span>
            <span
              aria-hidden="true"
              className={cn(
                "relative h-6 w-10 shrink-0 rounded-full border transition-colors",
                preferences.contrast
                  ? "border-primary bg-primary"
                  : "border-border bg-muted"
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 size-4.5 rounded-full bg-white shadow-sm transition-transform",
                  preferences.contrast ? "translate-x-[1.125rem]" : "translate-x-0.5"
                )}
              />
            </span>
          </button>

          <div className="mt-2 border-t border-border/70 pt-3">
            <div className="flex items-center gap-2 px-2">
              <Type className="size-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Tamanho do texto</p>
                <p className="text-xs text-muted-foreground">Aumenta somente a tipografia, não os controles.</p>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2" role="group" aria-label="Tamanho do texto">
              {FONT_SCALE_OPTIONS.map((option) => {
                const selected = preferences.fontScale === option.value
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={selected}
                    aria-label={`${option.label}, ${option.percent}`}
                    onClick={() =>
                      setPreferences((current) => ({ ...current, fontScale: option.value }))
                    }
                    className={cn(
                      "relative flex min-h-20 flex-col items-center justify-center rounded-2xl border px-2 py-2.5 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                      selected
                        ? "border-primary/40 bg-primary/10 text-foreground"
                        : "border-border bg-background/65 text-muted-foreground hover:bg-muted/60"
                    )}
                  >
                    {selected ? <Check className="absolute top-2 right-2 size-3.5 text-primary" /> : null}
                    <span className={cn("font-semibold leading-none text-foreground", option.sampleClassName)}>Aa</span>
                    <span className="mt-2 text-xs font-medium">{option.percent}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-3 w-full justify-center text-muted-foreground"
            disabled={!isModified}
            onClick={() => setPreferences(DEFAULT_PREFERENCES)}
          >
            <RotateCcw className="size-3.5" />
            Restaurar padrão
          </Button>
        </div>
      ) : null}

      <Button
        type="button"
        variant="outline"
        size="icon-lg"
        aria-label="Acessibilidade"
        aria-expanded={open}
        aria-controls="accessibility-preferences"
        onClick={() => setOpen((current) => !current)}
        className="relative size-11 border-border/80 bg-card/95 text-foreground shadow-lg shadow-black/15 backdrop-blur-xl hover:bg-card"
      >
        <Accessibility className="size-5" />
        {isModified ? (
          <span
            aria-hidden="true"
            className="absolute right-0.5 bottom-0.5 size-2.5 rounded-full border-2 border-card bg-primary"
          />
        ) : null}
      </Button>
    </div>
  )
}
