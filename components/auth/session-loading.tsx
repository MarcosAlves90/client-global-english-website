import { LoaderCircle } from "lucide-react"

export function SessionLoading({ label }: { label: string }) {
  return (
    <div
      className="flex min-h-svh items-center justify-center gap-3 bg-background px-6 text-sm text-muted-foreground"
      role="status"
      aria-live="polite"
    >
      <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}
