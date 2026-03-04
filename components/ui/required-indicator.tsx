"use client"

export function RequiredIndicator() {
  return (
    <span
      aria-hidden="true"
      className="text-destructive font-semibold leading-none"
      data-slot="required-indicator"
    >
      *
    </span>
  )
}
