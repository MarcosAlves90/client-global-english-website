import type { ActivityAnswerValue, ActivityQuestionType } from "@/lib/firebase/types"
import { isCloudinaryUrl } from "@/lib/cloudinary-url"
import { cn } from "@/lib/utils"

export function formatActivityAnswerValue(value: ActivityAnswerValue | undefined) {
  if (Array.isArray(value)) return value.length ? value.join(", ") : "Sem resposta"
  if (typeof value === "boolean") return value ? "Verdadeiro" : "Falso"
  if (typeof value === "string") return value.trim() || "Sem resposta"
  return "Sem resposta"
}

export function ActivityAnswerValueView({
  questionType,
  value,
  className,
}: Readonly<{
  questionType?: ActivityQuestionType
  value: ActivityAnswerValue | undefined
  className?: string
}>) {
  if (
    questionType === "audio_response" &&
    typeof value === "string" &&
    value.trim() &&
    isCloudinaryUrl(value)
  ) {
    return (
      <div className="space-y-1.5">
        <audio controls preload="metadata" src={value} className="h-9 max-w-full" />
        <a
          href={value}
          target="_blank"
          rel="noreferrer"
          className="text-[10px] font-medium text-primary hover:underline"
        >
          Abrir áudio em nova aba
        </a>
      </div>
    )
  }

  return (
    <p className={cn("wrap-break-word text-[11px] text-foreground/90", className)}>
      {formatActivityAnswerValue(value)}
    </p>
  )
}
