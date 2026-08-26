"use client"

import * as React from "react"
import { AlertCircle, CheckCircle2, LifeBuoy, Plus, Send } from "lucide-react"
import { toast } from "sonner"

import { DashboardNotice } from "@/components/dashboard/dashboard-feedback"
import { DashboardPage } from "@/components/dashboard/dashboard-page"
import { SearchField } from "@/components/dashboard/search-field"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/hooks/use-auth"
import { createSupportTicket, fetchUserSupportTickets } from "@/lib/firebase/firestore"
import type { SupportTicket } from "@/lib/firebase/types"
import { validateSupportTicketDraft } from "@/lib/support/tickets"

const FAQS = [
  { question: "Como altero minha senha?", answer: "Abra Configurações, entre em Segurança e informe a nova senha." },
  { question: "Onde acompanho minhas atividades?", answer: "A página Atividades separa pendências, atividades em andamento, revisões e itens concluídos." },
  { question: "Onde encontro minhas notas?", answer: "Abra Notas para consultar correções finais, referências automáticas e feedback do professor." },
  { question: "Como envio um problema para o suporte?", answer: "Selecione Nova solicitação, descreva o problema e acompanhe o protocolo nesta página." },
]

function formatTicketDate(value: Date | null) { return value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(value) : "Sincronizando" }

export default function Page() {
  const { user, isFirebaseReady } = useAuth()
  const [subject, setSubject] = React.useState("")
  const [message, setMessage] = React.useState("")
  const [query, setQuery] = React.useState("")
  const [tickets, setTickets] = React.useState<SupportTicket[]>([])
  const [showForm, setShowForm] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const loadTickets = React.useCallback(async () => { if (!user || !isFirebaseReady) { setTickets([]); return } try { setLoading(true); setError(null); setTickets(await fetchUserSupportTickets(user.uid)) } catch { setError("Não foi possível carregar seu histórico de suporte.") } finally { setLoading(false) } }, [isFirebaseReady, user])
  React.useEffect(() => { void loadTickets() }, [loadTickets])

  async function handleSubmit() {
    if (!user) return
    const validation = validateSupportTicketDraft({ subject, message })
    if (!validation.ok) return toast.error(validation.message)
    try { setSubmitting(true); await createSupportTicket({ uid: user.uid, ...validation.value }); setSubject(""); setMessage(""); setShowForm(false); await loadTickets(); toast.success("Solicitação enviada ao suporte.") } catch { toast.error("Não foi possível enviar a solicitação.") } finally { setSubmitting(false) }
  }

  const q = query.trim().toLocaleLowerCase("pt-BR")
  const faqs = FAQS.filter((item) => !q || `${item.question} ${item.answer}`.toLocaleLowerCase("pt-BR").includes(q))

  return <DashboardPage title="Central de Ajuda" description="Encontre uma resposta primeiro e abra uma solicitação quando precisar de atendimento." action={<Button size="sm" onClick={() => setShowForm((value) => !value)}><Plus className="size-4" />Nova solicitação</Button>}>
    {!isFirebaseReady ? <DashboardNotice>Firebase não configurado. O envio de tickets está indisponível.</DashboardNotice> : null}
    {error ? <DashboardNotice tone="danger">{error}</DashboardNotice> : null}

    <Card className="border-primary/15 py-0"><CardContent className="p-6"><div className="mx-auto max-w-2xl text-center"><div className="ge-icon-tile mx-auto size-11"><LifeBuoy className="size-5" /></div><h2 className="mt-3 text-xl font-semibold">Como podemos ajudar?</h2><SearchField value={query} onChange={setQuery} placeholder="Buscar nas perguntas frequentes..." ariaLabel="Buscar ajuda" className="relative mx-auto mt-4 max-w-xl" /></div></CardContent></Card>

    {showForm ? <Card className="max-w-3xl py-0"><CardContent className="space-y-4 p-6"><div><h2 className="font-semibold">Nova solicitação</h2><p className="mt-1 text-sm text-muted-foreground">Descreva o problema e o comportamento que esperava.</p></div><div className="space-y-2"><Label htmlFor="ticket-subject">Assunto</Label><Input id="ticket-subject" value={subject} maxLength={120} onChange={(event) => setSubject(event.target.value)} placeholder="Ex.: Não consigo abrir uma atividade" /></div><div className="space-y-2"><Label htmlFor="ticket-message">Descrição</Label><Textarea id="ticket-message" value={message} maxLength={4000} onChange={(event) => setMessage(event.target.value)} placeholder="Explique o que aconteceu." className="min-h-36" /></div><div className="flex gap-2"><Button onClick={() => void handleSubmit()} disabled={submitting || !user || !isFirebaseReady}><Send className="size-4" />{submitting ? "Enviando..." : "Enviar solicitação"}</Button><Button variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button></div></CardContent></Card> : null}

    <section className="space-y-3"><div><h2 className="text-lg font-semibold">Perguntas frequentes</h2><p className="text-sm text-muted-foreground">Orientações sobre funções disponíveis na plataforma.</p></div><div className="grid gap-3 md:grid-cols-2">{faqs.map((faq) => <Card key={faq.question} className="py-0"><CardContent className="p-5"><h3 className="text-sm font-semibold">{faq.question}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{faq.answer}</p></CardContent></Card>)}</div>{faqs.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma orientação corresponde à busca.</p> : null}</section>

    <section className="space-y-3"><div><h2 className="text-lg font-semibold">Suas solicitações</h2><p className="text-sm text-muted-foreground">Acompanhe protocolo e situação dos chamados enviados.</p></div>{loading ? <div className="h-24 animate-pulse rounded-xl bg-muted" /> : tickets.length === 0 ? <Card className="py-0"><CardContent className="p-5 text-sm text-muted-foreground">Nenhuma solicitação registrada.</CardContent></Card> : <Card className="overflow-hidden py-0"><CardContent className="divide-y divide-border p-0">{tickets.slice(0, 12).map((ticket) => <div key={ticket.id} className="flex items-start justify-between gap-4 px-5 py-4"><div className="min-w-0"><p className="truncate text-sm font-semibold">{ticket.subject}</p><p className="mt-1 text-xs text-muted-foreground">{formatTicketDate(ticket.createdAt)} · Protocolo {ticket.id.slice(0, 8)}</p></div><span className={ticket.status === "resolved" ? "inline-flex shrink-0 items-center gap-1 text-xs font-medium text-emerald-600" : "inline-flex shrink-0 items-center gap-1 text-xs font-medium text-amber-600"}>{ticket.status === "resolved" ? <CheckCircle2 className="size-3.5" /> : <AlertCircle className="size-3.5" />}{ticket.status === "resolved" ? "Resolvido" : "Aberto"}</span></div>)}</CardContent></Card>}</section>
  </DashboardPage>
}
