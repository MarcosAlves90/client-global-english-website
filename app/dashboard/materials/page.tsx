"use client"

import * as React from "react"
import { FileText, Link as LinkIcon, Video } from "lucide-react"

import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSectionHeader } from "@/components/dashboard-section-header"
import { DashboardStatCard } from "@/components/dashboard-stat-card"
import { StudentMaterialCard } from "@/modules/materials/ui/student-material-card"
import { useAuth } from "@/hooks/use-auth"
import { fetchUserMaterials } from "@/lib/firebase/firestore"
import type { Material } from "@/lib/firebase/types"


// Helper functions removed as they are now handled by StudentMaterialCard

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
          <DashboardStatCard title="Materiais" value={materials.length} icon={FileText} />
          <DashboardStatCard
            title="Anexos"
            value={totalAttachments}
            icon={LinkIcon}
          />
          <DashboardStatCard
            title="Textos"
            value={markdownCount}
            icon={FileText}
          />
          <DashboardStatCard
            title="Liberados"
            value={materials.length}
            icon={Video}
          />
        </div>

        <DashboardSectionHeader
          title="Biblioteca de Materiais"
          description="Acesse textos, anexos e links liberados pelos módulos."
          icon={FileText}
        />

        {loading ? (
          <div className="flex h-64 items-center justify-center text-muted-foreground animate-pulse">
            Sincronizando biblioteca...
          </div>
        ) : materials.length === 0 ? (
          <div className="flex flex-col gap-4 rounded-2xl border border-dashed border-primary/20 bg-primary/5 p-12 text-center backdrop-blur-sm">
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <FileText className="size-8" />
            </div>
            <div className="space-y-1">
              <p className="text-lg font-bold tracking-tight text-foreground">
                Nenhum material disponível
              </p>
              <p className="text-sm text-muted-foreground/60">
                Assim que novos conteúdos forem liberados, eles aparecerão aqui.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {materials.map((material) => (
              <StudentMaterialCard key={material.id} material={material} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
