"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  BookOpen,
  Copy,
  ExternalLink,
  FileAudio,
  FileText,
  Link as LinkIcon,
    Video,
} from "lucide-react"

import {
  DashboardEmptyState,
  DashboardNotice,
} from "@/components/dashboard/dashboard-feedback"
import { DashboardPage } from "@/components/dashboard/dashboard-page"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { fetchUserMaterials } from "@/lib/firebase/firestore"
import { toFriendlyFirestoreLoadError } from "@/lib/firebase/error-message"
import type { Material } from "@/lib/firebase/types"
import { toast } from "sonner"

const MarkdownPreview = dynamic(() => import("@uiw/react-markdown-preview"), {
  ssr: false,
})

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  video: Video,
  audio: FileAudio,
  link: LinkIcon,
  pdf: FileText,
  markdown: BookOpen,
}

const typeLabels: Record<string, string> = {
  video: "Vídeo",
  audio: "Áudio",
  link: "Link",
  pdf: "PDF",
  markdown: "Texto",
}

function resolvePrimaryType(material: Material): string {
  const attachmentType = material.attachments?.find((item) => item.type)?.type
  return attachmentType ?? material.type ?? "pdf"
}

export default function MaterialDetailPage() {
  const params = useParams<{ materialId: string }>()
  const router = useRouter()
  const { user, isFirebaseReady } = useAuth()

  const [material, setMaterial] = React.useState<Material | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    async function loadMaterial() {
      if (!user || !isFirebaseReady || !params.materialId) {
        return
      }

      setLoading(true)
      try {
        setError(null)
        const data = await fetchUserMaterials(user.uid)
        const found = data.find((item) => item.id === params.materialId) ?? null
        setMaterial(found)
      } catch (err) {
        setError(
          toFriendlyFirestoreLoadError(
            err,
            "Não foi possível carregar o material selecionado."
          )
        )
      } finally {
        setLoading(false)
      }
    }

    void loadMaterial()
  }, [user, isFirebaseReady, params.materialId])

  const primaryType = material ? resolvePrimaryType(material) : "pdf"
  const attachments = material?.attachments ?? []
  const hasMarkdown = Boolean(material?.markdown?.trim())

  const handleCopy = React.useCallback(async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      toast.success("Link copiado")
    } catch {
      toast.error("Não foi possível copiar o link")
    }
  }, [])

  return (
    <DashboardPage
      title="Material"
      description="Visualização detalhada de conteúdo, leitura e anexos."
      contentClassName="gap-6"
    >
        <div className="flex items-center justify-between gap-3">
          <Button variant="outline" asChild>
            <Link href="/dashboard/materials">
              <ArrowLeft className="mr-2 size-4" />
              Voltar para materiais
            </Link>
          </Button>
        </div>

        {!isFirebaseReady ? (
          <DashboardNotice>
            Firebase não configurado. Conecte para visualizar seus materiais reais.
          </DashboardNotice>
        ) : null}

        {error ? (
          <DashboardNotice tone="danger">{error}</DashboardNotice>
        ) : null}

        {loading ? (
          <div className="ge-surface-muted flex h-64 items-center justify-center text-muted-foreground animate-pulse">
            Carregando material...
          </div>
        ) : material === null ? (
          <DashboardEmptyState
            icon={FileText}
            title="Material não encontrado"
            description="Este item pode ter sido removido ou não está mais disponível para você."
            action={
              <Button onClick={() => router.push("/dashboard/materials")}>
                Voltar para biblioteca
              </Button>
            }
          />
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="space-y-6">
              <Card className="overflow-hidden">
                <CardHeader className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                      {typeLabels[primaryType] ?? "Material"}
                    </span>
                    <span className="text-xs font-medium text-muted-foreground">
                      {attachments.length} anexo(s)
                    </span>
                  </div>
                  <CardTitle className="text-2xl font-bold tracking-tight leading-tight">
                    {material.title}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Material {material.trackId ? "vinculado a módulo" : "de nível de curso"}.
                  </p>
                </CardHeader>
                <CardContent>
                  {hasMarkdown ? (
                    <div className="ge-inset p-4">
                      <div className="mb-3 inline-flex items-center gap-2 rounded-lg bg-primary/8 px-2.5 py-1 text-xs font-medium text-primary">
                        <BookOpen className="size-3" />
                        Leitura guiada
                      </div>
                      <div className="max-w-none text-sm leading-relaxed">
                        <MarkdownPreview
                          source={material.markdown ?? ""}
                          style={{
                            backgroundColor: "transparent",
                            padding: 0,
                            maxWidth: "100%",
                            overflowX: "auto",
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="ge-surface-muted p-6 text-center">
                      <p className="text-sm font-semibold text-foreground">Sem descrição textual</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Este material é focado em anexos e links de apoio.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="lg:sticky lg:top-6">
                <CardHeader>
                  <CardTitle className="text-base font-bold">Recursos do material</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(material.url?.trim() ?? "") ? (
                    <a
                      href={material.url?.trim()}
                      target="_blank"
                      rel="noreferrer"
                      className="ge-inset flex items-center justify-between px-3 py-2 text-sm font-medium transition-colors hover:border-primary/30 hover:bg-primary/5"
                    >
                      <span>Link principal</span>
                      <ExternalLink className="size-4 text-primary" />
                    </a>
                  ) : null}

                  {attachments.length > 0 ? (
                    attachments.map((attachment, index) => {
                      const itemType = attachment.type ?? "pdf"
                      const AttachmentIcon = typeIcons[itemType] ?? FileText
                      return (
                        <div
                          key={`${material.id}-${index}`}
                          className="ge-inset p-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex items-start gap-2">
                              <div className="mt-0.5 rounded-full bg-primary/10 p-1.5 text-primary">
                                <AttachmentIcon className="size-3.5" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-semibold wrap-break-word">
                                  {attachment.name || `Anexo ${index + 1}`}
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {typeLabels[itemType] ?? "Arquivo"}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              {attachment.url ? (
                                <>
                                  <a
                                    href={attachment.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex size-7 items-center justify-center rounded-full border border-border/70 bg-background/60 text-primary transition-colors hover:bg-primary/10"
                                    aria-label={`Abrir anexo ${attachment.name || index + 1}`}
                                  >
                                    <ExternalLink className="size-3.5" />
                                  </a>
                                  <button
                                    type="button"
                                    onClick={() => void handleCopy(attachment.url)}
                                    className="inline-flex size-7 items-center justify-center rounded-full border border-border/70 bg-background/60 text-primary transition-colors hover:bg-primary/10"
                                    aria-label={`Copiar link do anexo ${attachment.name || index + 1}`}
                                  >
                                    <Copy className="size-3.5" />
                                  </button>
                                </>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="ge-surface-muted rounded-xl p-4 text-center">
                      <p className="text-xs text-muted-foreground">Sem anexos cadastrados neste material.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
    </DashboardPage>
  )
}
