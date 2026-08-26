import { Search, X } from "lucide-react"

import { Input } from "@/components/ui/input"

export function SearchField({ value, onChange, placeholder = "Buscar...", ariaLabel = "Buscar", className }: { value: string; onChange: (value: string) => void; placeholder?: string; ariaLabel?: string; className?: string }) {
  return (
    <div className={className ?? "relative"}>
      <Search className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-foreground/60" />
      <Input aria-label={ariaLabel} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="pl-9 pr-9" />
      {value ? (
        <button type="button" aria-label="Limpar busca" onClick={() => onChange("")} className="absolute right-2.5 top-1/2 z-10 -translate-y-1/2 rounded-md p-1 text-foreground/60 hover:bg-muted hover:text-foreground">
          <X className="size-3.5" />
        </button>
      ) : null}
    </div>
  )
}
