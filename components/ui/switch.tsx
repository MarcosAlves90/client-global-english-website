"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

type SwitchProps = {
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange">

export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  (
    {
      className,
      checked,
      defaultChecked,
      onCheckedChange,
      disabled,
      ...props
    },
    ref
  ) => {
    const isControlled = typeof checked === "boolean"
    const [internalChecked, setInternalChecked] = React.useState(
      defaultChecked ?? false
    )

    const isChecked = isControlled ? checked : internalChecked

    function toggle() {
      if (disabled) {
        return
      }
      const nextValue = !isChecked
      if (!isControlled) {
        setInternalChecked(nextValue)
      }
      onCheckedChange?.(nextValue)
    }

    return (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={isChecked}
        data-state={isChecked ? "checked" : "unchecked"}
        disabled={disabled}
        onClick={toggle}
        className={cn(
          "relative inline-flex h-6 w-11 items-center rounded-full border border-border/70 bg-muted/80 shadow-inner shadow-black/10 transition-[background-color,border-color,box-shadow] data-[state=checked]:border-primary/30 data-[state=checked]:bg-primary",
          "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/25",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      >
        <span
          className={cn(
            "inline-block size-5 rounded-full border border-black/5 bg-background shadow-sm shadow-black/20 transition-transform",
            isChecked ? "translate-x-5" : "translate-x-1"
          )}
        />
      </button>
    )
  }
)
Switch.displayName = "Switch"
