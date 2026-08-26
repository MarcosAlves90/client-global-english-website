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

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
        "ge-surface-interactive group flex h-full flex-col overflow-hidden py-0",
        className
      )}
    >
      <CardContent className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="ge-icon-tile size-11 rounded-full transition-transform duration-300 group-hover:scale-105">
            <Icon className="size-5" />
          </div>
          <span className="ge-chip">
            <Sparkles className="size-3 text-primary/70" />
            {typeLabels[baseType] || "Material"}
          </span>
        </div>

        <div className="space-y-1.5">
          <h3 className="line-clamp-2 text-base font-semibold tracking-[-0.025em] text-foreground transition-colors group-hover:text-primary">
            {material.title}
          </h3>
          <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
            {hasMarkdown
              ? "Material com leitura guiada e apoio para estudo continuo."
              : "Conteudo de apoio para acelerar seu progresso no curso."}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {statChips.map((chip) => (
            <span key={chip} className="ge-chip bg-primary/5">
              {chip}
            </span>
          ))}
        </div>

        <div className="mt-auto flex items-center gap-2 border-t border-border/60 pt-4">
          <Button className="w-full" asChild>
            <Link href={`/dashboard/materials/${material.id}`}>Ver material completo</Link>
          </Button>
          {primaryLink ? (
            <Button variant="outline" size="icon" className="shrink-0" asChild>
              <a
                href={primaryLink}
                target="_blank"
                rel="noreferrer"
                aria-label="Abrir link principal do material"
              >
                <ExternalLink className="size-4" />
              </a>
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
