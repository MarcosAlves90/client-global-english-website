import * as React from "react"

import { cn } from "@/lib/utils"

export function NativeSelect({
  className,
  ...props
}: React.ComponentProps<"select">) {
  return (
    <select
      data-slot="native-select"
      className={cn(
        "ge-control h-10 w-full min-w-0 px-3 py-1 text-base text-foreground outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      {...props}
    />
  )
}
