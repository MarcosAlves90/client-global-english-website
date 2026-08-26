"use client"

import * as React from "react"
import { FileText } from "lucide-react"

import { DashboardEmptyState, DashboardNotice } from "@/components/dashboard/dashboard-feedback"
import { DashboardPage } from "@/components/dashboard/dashboard-page"
import { SearchField } from "@/components/dashboard/search-field"
import { SegmentedControl } from "@/components/dashboard/segmented-control"
import { useAuth } from "@/hooks/use-auth"
import { toFriendlyFirestoreLoadError } from "@/lib/firebase/error-message"
import { fetchUserMaterials } from "@/lib/firebase/firestore"
import type { Material } from "@/lib/firebase/types"
import { StudentMaterialCard } from "@/modules/materials/ui/student-material-card"

type MaterialFilter = "all" | "pdf" | "video" | "audio" | "link" | "markdown"
export default function Page() {
  const { user, isFirebaseReady } = useAuth()
  const [materials, setMaterials] = React.useState<Material[]>([])
  const [query, setQuery] = React.useState("")
  const [filter, setFilter] = React.useState<MaterialFilter>("all")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => { async function load() { if (!user || !isFirebaseReady) return; try { setLoading(true); setError(null); setMaterials(await fetchUserMaterials(user.uid)) } catch (loadError) { setError(toFriendlyFirestoreLoadError(loadError, "Não foi possível carregar seus materiais.")) } finally { setLoading(false) } } void load() }, [isFirebaseReady, user])
  const filtered = materials.filter((material) => { const resolvedType = material.type ?? material.attachments?.find((item) => item.type)?.type ?? (material.markdown?.trim() ? "markdown" : "pdf"); const q = query.trim().toLocaleLowerCase("pt-BR"); return (!q || material.title.toLocaleLowerCase("pt-BR").includes(q)) && (filter === "all" || resolvedType === filter) })

  return <DashboardPage title="Materiais" description="Uma biblioteca simples para encontrar textos, PDFs, vídeos, áudios e links." toolbar={<><SearchField value={query} onChange={setQuery} placeholder="Buscar materiais..." className="relative min-w-0 flex-1 sm:max-w-sm" /><SegmentedControl value={filter} onChange={setFilter} ariaLabel="Filtrar materiais" options={[{ value: "all", label: "Todos" }, { value: "pdf", label: "PDF" }, { value: "video", label: "Vídeo" }, { value: "audio", label: "Áudio" }, { value: "link", label: "Links" }, { value: "markdown", label: "Textos" }]} /></>}>
    {!isFirebaseReady ? <DashboardNotice>Firebase não configurado. Conecte para visualizar seus materiais reais.</DashboardNotice> : null}
    {error ? <DashboardNotice tone="danger">{error}</DashboardNotice> : null}
    {loading ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{[0,1,2].map((item) => <div key={item} className="h-52 animate-pulse rounded-2xl bg-muted" />)}</div> : filtered.length === 0 ? <DashboardEmptyState icon={FileText} title="Nenhum material encontrado" description={query ? "Tente outra busca ou filtro." : "Assim que conteúdos forem liberados, eles aparecerão aqui."} /> : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{filtered.map((material) => <StudentMaterialCard key={material.id} material={material} />)}</div>}
  </DashboardPage>
}
