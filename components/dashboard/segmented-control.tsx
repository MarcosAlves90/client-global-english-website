
import { cn } from "@/lib/utils"

export type SegmentOption<T extends string> = { value: T; label: string; count?: number }

export function SegmentedControl<T extends string>({ value, options, onChange, ariaLabel = "Filtro", className }: { value: T; options: SegmentOption<T>[]; onChange: (value: T) => void; ariaLabel?: string; className?: string }) {
  return (
    <div role="group" aria-label={ariaLabel} className={cn("inline-flex max-w-full gap-1 overflow-x-auto rounded-xl bg-muted p-1", className)}>
      {options.map((option) => {
        const active = option.value === value
        return (
          <button key={option.value} type="button" aria-pressed={active} onClick={() => onChange(option.value)} className={cn("shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors", active ? "bg-background text-foreground shadow-sm" : "hover:text-foreground")}>
            {option.label}{typeof option.count === "number" ? <span className="ml-1.5 text-xs opacity-60">{option.count}</span> : null}
          </button>
        )
      })}
    </div>
  )
}
