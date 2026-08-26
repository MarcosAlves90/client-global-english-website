"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowRight, GraduationCap, Users2 } from "lucide-react"

import { DashboardNotice } from "@/components/dashboard/dashboard-feedback"
import { DashboardPage } from "@/components/dashboard/dashboard-page"
import { DashboardStatCard } from "@/components/dashboard/dashboard-stat-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/hooks/use-auth"
import { fetchAdminOverview } from "@/lib/firebase/firestore"
import type { AdminOverview } from "@/lib/firebase/types"

export default function Page() {
  const { role, isFirebaseReady } = useAuth()
  const [overview, setOverview] = React.useState<AdminOverview | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => { if (!isFirebaseReady || role !== "admin") return; let active = true; async function load() { try { setLoading(true); setError(null); const data = await fetchAdminOverview(); if (active) setOverview(data) } catch { if (active) setError("Não foi possível carregar os indicadores.") } finally { if (active) setLoading(false) } } void load(); return () => { active = false } }, [isFirebaseReady, role])

  if (role !== "admin") return <DashboardPage title="Administração" description="Gestão da plataforma."><DashboardNotice tone="danger">Esta área é exclusiva para administradores.</DashboardNotice></DashboardPage>

  return <DashboardPage title="Administração" description="Acesse as áreas de gestão sem misturar controles administrativos ao fluxo do aluno.">
    {!isFirebaseReady ? <DashboardNotice>Firebase não configurado. Conecte para visualizar dados reais.</DashboardNotice> : null}
    {error ? <DashboardNotice tone="danger">{error}</DashboardNotice> : null}
    <div className="grid gap-3 sm:grid-cols-2"><DashboardStatCard title="Usuários cadastrados" value={overview?.usersCount ?? "—"} icon={Users2} loading={loading} /><DashboardStatCard title="Cursos cadastrados" value={overview?.coursesCount ?? "—"} icon={GraduationCap} loading={loading} /></div>
    <section className="space-y-3"><div><h2 className="text-lg font-semibold">Gestão</h2><p className="text-sm text-muted-foreground">Escolha o recurso que deseja administrar.</p></div><div className="grid gap-3 md:grid-cols-2"><Card className="py-0"><CardContent className="p-5"><div className="ge-icon-tile size-10"><Users2 className="size-4.5" /></div><h3 className="mt-4 font-semibold">Usuários</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">Gerencie contas, papéis e status de alunos, professores e administradores.</p><Button asChild variant="outline" size="sm" className="mt-4"><Link href="/dashboard/admin/users">Abrir usuários <ArrowRight className="size-3.5" /></Link></Button></CardContent></Card><Card className="py-0"><CardContent className="p-5"><div className="ge-icon-tile size-10"><GraduationCap className="size-4.5" /></div><h3 className="mt-4 font-semibold">Cursos</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">Administre cursos, módulos, atividades, materiais e professores atribuídos.</p><Button asChild variant="outline" size="sm" className="mt-4"><Link href="/dashboard/admin/courses">Abrir cursos <ArrowRight className="size-3.5" /></Link></Button></CardContent></Card></div></section>
  </DashboardPage>
}
