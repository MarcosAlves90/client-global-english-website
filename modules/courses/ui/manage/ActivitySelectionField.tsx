"use client"

import { Label } from "@/components/ui/label"
import { NativeSelect } from "@/components/ui/native-select"
import type { Activity, Track } from "@/lib/firebase/types"

type ActivitySelectionFieldProps = Readonly<{
  activities: Activity[]
  selectedActivityId: string
  onSelectedActivityIdChange: (value: string) => void
  trackById: Map<string, Track>
}>

export function ActivitySelectionField({
  activities,
  selectedActivityId,
  onSelectedActivityIdChange,
  trackById,
}: ActivitySelectionFieldProps) {
  return (
    <div className="space-y-1">
      <Label
        htmlFor="activity-insights-selection"
        className="text-[10px] font-medium text-muted-foreground/70"
      >
        Atividade selecionada
      </Label>
      <NativeSelect
        id="activity-insights-selection"
        value={selectedActivityId}
        onChange={(event) => onSelectedActivityIdChange(event.target.value)}
        className="h-9 text-xs font-semibold"
      >
        {activities.map((activity) => (
          <option key={activity.id} value={activity.id}>
            [{trackById.get(activity.trackId)?.title ?? "Sem modulo"}] {activity.title}
          </option>
        ))}
      </NativeSelect>
    </div>
  )
}
