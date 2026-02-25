"use client"

import * as React from "react"
import { FileAudio, FileText, Link as LinkIcon, Video } from "lucide-react"

import { DashboardHeader } from "@/components/dashboard-header"
import { SummaryCard } from "@/components/summary-card"
import { useAuth } from "@/hooks/use-auth"
import { fetchUserMaterials } from "@/lib/firebase/firestore"
import type { Material } from "@/lib/firebase/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const MATERIAL_TYPE_LABELS: Record<string, string> = {
  pdf: "PDF",
  video: "Vídeo",
  audio: "Áudio",
  link: "Link",
}

function resolveMaterialIcon(type?: string) {
  switch (type) {
    case "video":
      return Video
    case "audio":
      return FileAudio
    case "link":
      return LinkIcon
    case "pdf":
    default:
      return FileText
  }
}

function resolveMaterialMeta(material: Material) {
  const attachments = material.attachments ?? []
  const attachmentType = attachments.find((item) => item.type)?.type
  const baseType = attachmentType ?? material.type
  const hasMarkdown = Boolean(material.markdown?.trim())
  const hasLink = Boolean(material.url?.trim())

  const detailParts: string[] = []
  if (hasMarkdown) {
    detailParts.push("Texto")
  }
  if (attachments.length) {
    detailParts.push(
      `${attachments.length} anexo${attachments.length > 1 ? "s" : ""}`
    )
  }
  if (hasLink && !attachments.length) {
    detailParts.push("Link")
  }

  return {
    icon: resolveMaterialIcon(baseType),
    typeLabel:
      baseType && MATERIAL_TYPE_LABELS[baseType]
        ? MATERIAL_TYPE_LABELS[baseType]
        : "Material",
    details: detailParts.join(" • "),
  }
}

export default function Page() {
  const { user, isFirebaseReady } = useAuth()
  const [materials, setMaterials] = React.useState<Material[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    async function loadMaterials() {
      if (!user || !isFirebaseReady) {
        return
      }

      setLoading(true)
      try {
        setError(null)
        const data = await fetchUserMaterials(user.uid)
        setMaterials(data)
      } catch {
        setError("Não foi possível carregar seus materiais.")
      } finally {
        setLoading(false)
      }
    }

    void loadMaterials()
  }, [user, isFirebaseReady])

  const totalAttachments = React.useMemo(
    () =>
      materials.reduce(
        (acc, material) => acc + (material.attachments?.length ?? 0),
        0
      ),
    [materials]
  )
  const markdownCount = React.useMemo(
    () => materials.filter((material) => material.markdown?.trim()).length,
    [materials]
  )

  return (
    <div>
      <DashboardHeader
        title="Materiais"
        description="Acesse textos, anexos e links liberados pelos módulos."
      />

      <div className="flex flex-col gap-6 p-6">
        {!isFirebaseReady ? (
          <div className="rounded-2xl border border-dashed bg-accent/40 p-4 text-sm text-muted-foreground">
            Firebase não configurado. Conecte para visualizar seus materiais reais.
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-dashed border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Materiais" value={materials.length} icon={FileText} />
          <SummaryCard
            label="Anexos"
            value={totalAttachments}
            icon={LinkIcon}
          />
          <SummaryCard
            label="Textos"
            value={markdownCount}
            icon={FileText}
          />
          <SummaryCard
            label="Liberados"
            value={materials.length}
            icon={Video}
          />
        </div>

        {loading ? (
          <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
            Carregando materiais...
          </div>
        ) : materials.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-6 text-center">
            <FileText className="mx-auto size-6 text-muted-foreground" />
            <p className="mt-2 text-sm font-medium">
              Nenhum material disponível
            </p>
            <p className="text-xs text-muted-foreground">
              Assim que novos conteúdos forem liberados, eles aparecerão aqui.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {materials.map((material) => {
              const meta = resolveMaterialMeta(material)
              const Icon = meta.icon

              return (
                <Card key={material.id}>
                  <CardHeader className="space-y-2">
                    <Icon className="size-5 text-muted-foreground" />
                    <CardTitle className="text-base">{material.title}</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {meta.typeLabel}
                      {meta.details ? ` • ${meta.details}` : ""}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {material.trackId
                          ? "Material do módulo"
                          : "Material do curso"}
                      </span>
                      <Button size="sm" variant="outline">
                        Abrir
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
