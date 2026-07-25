"use client"

import * as React from "react"
import { Contrast, Type } from "lucide-react"

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

const FONT_SCALE_LABELS: Record<FontScale, string> = {
  normal: "A+",
  large: "A++",
  xlarge: "A+++",
}

function isFontScale(value: unknown): value is FontScale {
  return value === "normal" || value === "large" || value === "xlarge"
}

function readPreferences(): AccessibilityPreferences {
  if (globalThis.window === undefined) {
    return DEFAULT_PREFERENCES
  }

  const raw = globalThis.localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return DEFAULT_PREFERENCES
  }

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

  if (preferences.contrast) {
    root.dataset.contrast = "high"
  } else {
    delete root.dataset.contrast
  }

  if (preferences.fontScale === "normal") {
    delete root.dataset.fontScale
  } else {
    root.dataset.fontScale = preferences.fontScale
  }
}

function persistPreferences(preferences: AccessibilityPreferences) {
  globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
}

function nextFontScale(fontScale: FontScale): FontScale {
  if (fontScale === "normal") {
    return "large"
  }

  if (fontScale === "large") {
    return "xlarge"
  }

  return "normal"
}

export function AccessibilityMenu() {
  const [preferences, setPreferences] = React.useState(DEFAULT_PREFERENCES)
  const [hydrated, setHydrated] = React.useState(false)

  React.useEffect(() => {
    const stored = readPreferences()
    setPreferences(stored)
    applyPreferences(stored)
    setHydrated(true)
  }, [])

  React.useEffect(() => {
    if (!hydrated) {
      return
    }

    applyPreferences(preferences)
    persistPreferences(preferences)
  }, [hydrated, preferences])

  const fontScaleLabel = FONT_SCALE_LABELS[preferences.fontScale]

  const toggleContrast = React.useCallback(() => {
    setPreferences((current) => ({
      ...current,
      contrast: !current.contrast,
    }))
  }, [])

  const increaseText = React.useCallback(() => {
    setPreferences((current) => ({
      ...current,
      fontScale: nextFontScale(current.fontScale),
    }))
  }, [])

  return (
    <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 md:bottom-auto md:left-auto md:right-0 md:top-1/2 md:-translate-y-1/2 md:translate-x-0">
      <div className="flex flex-row gap-2 md:flex-col md:items-end md:gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "h-11 w-11 rounded-2xl border border-border/50 bg-card/40 text-foreground shadow-sm shadow-black/10 backdrop-blur-xl transition-all duration-200",
            "hover:-translate-y-0.5 hover:bg-card hover:shadow-lg hover:shadow-black/10",
            "focus-visible:ring-0 focus-visible:ring-offset-0",
            preferences.contrast &&
              "border-primary/20 bg-primary/10 text-primary",
            "md:h-12 md:w-12 md:rounded-l-2xl md:rounded-r-none md:border-y md:border-l md:border-r-0"
          )}
          onClick={toggleContrast}
          aria-pressed={preferences.contrast}
          aria-label={`Alto contraste ${preferences.contrast ? "ativo" : "inativo"}`}
          title="Alto contraste"
        >
          <Contrast className="size-5 drop-shadow-sm md:size-6" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          className={cn(
            "h-11 w-11 rounded-2xl border border-border/50 bg-card/40 text-foreground shadow-sm shadow-black/10 backdrop-blur-xl transition-all duration-200",
            "hover:-translate-y-0.5 hover:bg-card hover:text-primary hover:shadow-lg hover:shadow-black/10",
            "focus-visible:ring-0 focus-visible:ring-offset-0",
            "md:h-12 md:w-12 md:rounded-l-2xl md:rounded-r-none md:border-y md:border-l md:border-r-0"
          )}
          onClick={increaseText}
          aria-label={`Aumentar letras. Tamanho atual ${fontScaleLabel}`}
          title={`Aumentar letras: ${fontScaleLabel}`}
        >
          <Type className="size-5 drop-shadow-sm md:size-6" />
        </Button>
      </div>
    </div>
  )
}
