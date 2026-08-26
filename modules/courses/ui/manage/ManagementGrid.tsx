import * as React from "react"

import { cn } from "@/lib/utils"

export function ManagementGrid({
  showCreatePanel,
  children,
  className,
}: Readonly<{
  showCreatePanel: boolean
  children: React.ReactNode
  className?: string
}>) {
  return (
    <div
      className={cn(
        "grid gap-6",
        showCreatePanel && "lg:grid-cols-[minmax(0,1.35fr)_minmax(22rem,0.9fr)]",
        className
      )}
    >
      {children}
    </div>
  )
}
