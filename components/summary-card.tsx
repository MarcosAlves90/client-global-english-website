"use client"

import * as React from "react"
import type { LucideIcon } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type SummaryCardProps = {
  label: string
  value: string | number
  description?: string
  icon?: LucideIcon
  className?: string
}

export const SummaryCard = React.memo(function SummaryCard({
  label,
  value,
  description,
  icon: Icon,
  className,
}: SummaryCardProps) {
  return (
    <Card className={cn("border-muted-foreground/15", className)}>
      <CardContent className="flex items-center gap-4 p-4">
        {Icon ? (
          <div className="flex size-10 items-center justify-center rounded-xl bg-accent/60 text-muted-foreground">
            <Icon className="size-5" />
          </div>
        ) : null}
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-semibold text-foreground">{value}</p>
          {description ? (
            <p className="text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
})
