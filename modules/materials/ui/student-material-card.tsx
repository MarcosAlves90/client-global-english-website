"use client"

import * as React from "react"
import Link from "next/link"
import {
  BookOpen,
  ExternalLink,
  FileAudio,
  FileText,
  Link as LinkIcon,
  Sparkles,
  Video,
} from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Material } from "@/lib/firebase/types"

interface StudentMaterialCardProps {
  material: Material
  className?: string
}

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  video: Video,
  audio: FileAudio,
  link: LinkIcon,
  pdf: FileText,
  markdown: BookOpen,
}

const typeLabels: Record<string, string> = {
  video: "Video",
  audio: "Audio",
  link: "Link",
  pdf: "PDF",
  markdown: "Texto",
}

function resolvePrimaryLink(material: Material) {
  const attachments = material.attachments ?? []
  if (attachments.length > 0 && attachments[0]?.url) {
    return attachments[0].url
  }
  if (material.url?.trim()) {
    return material.url.trim()
  }
  return null
}

export function StudentMaterialCard({ material, className }: StudentMaterialCardProps) {
  const attachments = material.attachments ?? []
  const attachmentType = attachments.find((item) => item.type)?.type
  const baseType = (attachmentType ?? (material.type || "pdf")) as keyof typeof typeIcons
  const Icon = typeIcons[baseType] || FileText
  const primaryLink = resolvePrimaryLink(material)
  const hasMarkdown = Boolean(material.markdown?.trim())

  const statChips = [
    hasMarkdown ? "Texto" : null,
    attachments.length ? `${attachments.length} anexo${attachments.length > 1 ? "s" : ""}` : null,
    material.trackId ? "Modulo" : "Curso",
  ].filter((item): item is string => Boolean(item))

  return (
    <Card
      className={cn(
        "group flex h-full flex-col overflow-hidden border-primary/15 bg-card/50 py-0 backdrop-blur-sm transition-all duration-300",
        "hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10",
        className
      )}
    >
      <CardContent className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="rounded-2xl border border-primary/15 bg-primary/10 p-3 text-primary transition-transform duration-300 group-hover:scale-105">
            <Icon className="size-5" />
          </div>
          <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-background/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">
            <Sparkles className="size-3 text-primary/70" />
            {typeLabels[baseType] || "Material"}
          </span>
        </div>

        <div className="space-y-1.5">
          <h3 className="line-clamp-2 text-base font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
            {material.title}
          </h3>
          <p className="line-clamp-2 text-sm text-muted-foreground/80">
            {hasMarkdown
              ? "Material com leitura guiada e apoio para estudo continuo."
              : "Conteudo de apoio para acelerar seu progresso no curso."}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {statChips.map((chip) => (
            <span
              key={chip}
              className="rounded-full border border-primary/10 bg-primary/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/80"
            >
              {chip}
            </span>
          ))}
        </div>

        <div className="mt-auto flex items-center gap-2 border-t border-primary/10 pt-4">
          <Button className="w-full rounded-full font-semibold" asChild>
            <Link href={`/dashboard/materials/${material.id}`}>
              Ver material completo
            </Link>
          </Button>
          {primaryLink ? (
            <Button variant="outline" size="icon" className="rounded-full shrink-0" asChild>
              <a href={primaryLink} target="_blank" rel="noreferrer" aria-label="Abrir link principal do material">
                <ExternalLink className="size-4" />
              </a>
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
