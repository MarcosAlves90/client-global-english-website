import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, BookOpen, CheckCircle2, ClipboardCheck, GraduationCap } from "lucide-react"

import { DashboardMockup } from "@/components/landing/dashboard-mockup"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/ui/logo"
import { buildPageMetadata } from "@/lib/seo"

export const metadata: Metadata = buildPageMetadata({ title: "Seu próximo nível começa aqui", description: "Cursos, atividades, materiais e progresso em uma experiência simples para estudar inglês.", path: "/" })

const features = [
  { icon: GraduationCap, title: "Cursos organizados", description: "Veja o conteúdo por módulos e sempre saiba onde continuar." },
  { icon: ClipboardCheck, title: "Atividades claras", description: "Prazos, revisões e feedback aparecem no contexto certo." },
  { icon: BookOpen, title: "Materiais fáceis de achar", description: "PDFs, vídeos, áudios, textos e links em uma única biblioteca." },
]

export default function Home() {
  return <div className="min-h-svh bg-background text-foreground">
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/88 backdrop-blur-xl"><div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8"><Link href="/" className="flex items-center gap-2.5 font-semibold"><span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Logo className="size-5" /></span>Global English</Link><div className="flex items-center gap-2"><a href="#experiencia" className="hidden px-3 py-2 text-sm text-muted-foreground hover:text-foreground sm:inline">Experiência</a><Button asChild size="sm"><Link href="/login">Acessar plataforma <ArrowRight className="size-3.5" /></Link></Button></div></div></header>
    <main>
      <section className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-[0.9fr_1.1fr] lg:py-32"><div className="max-w-xl"><p className="text-sm font-medium text-primary">Global English Learning Hub</p><h1 className="mt-4 text-5xl font-semibold leading-[1.02] tracking-[-0.06em] sm:text-6xl">Aprenda inglês sem perder tempo procurando o próximo passo.</h1><p className="mt-6 max-w-lg text-lg leading-8 text-muted-foreground">Cursos, atividades, agenda, notas e materiais organizados em uma experiência simples para aluno e professor.</p><div className="mt-8 flex flex-wrap gap-3"><Button asChild size="lg"><Link href="/login">Entrar na plataforma <ArrowRight className="size-4" /></Link></Button><Button asChild variant="outline" size="lg"><a href="#experiencia">Conhecer a experiência</a></Button></div><div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground"><span className="inline-flex items-center gap-1.5"><CheckCircle2 className="size-4 text-emerald-600" />Progresso real</span><span className="inline-flex items-center gap-1.5"><CheckCircle2 className="size-4 text-emerald-600" />Feedback do professor</span><span className="inline-flex items-center gap-1.5"><CheckCircle2 className="size-4 text-emerald-600" />Acesso responsivo</span></div></div><DashboardMockup /></section>
      <section id="experiencia" className="border-y border-border bg-muted/35"><div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24"><div className="max-w-2xl"><p className="text-sm font-medium text-primary">Uma interface com menos ruído</p><h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">O conteúdo importante fica em primeiro plano.</h2><p className="mt-4 text-base leading-7 text-muted-foreground">A navegação muda conforme o contexto de aluno, professor ou administração, sem misturar funções que não pertencem à mesma tarefa.</p></div><div className="mt-10 grid gap-4 md:grid-cols-3">{features.map((feature) => <article key={feature.title} className="rounded-3xl border border-border bg-card p-6"><div className="ge-icon-tile size-10"><feature.icon className="size-4.5" /></div><h3 className="mt-4 font-semibold">{feature.title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.description}</p></article>)}</div></div></section>
      <section className="mx-auto max-w-4xl px-5 py-20 text-center sm:px-8 sm:py-28"><h2 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Entre, encontre o foco e continue.</h2><p className="mx-auto mt-4 max-w-xl text-base leading-7 text-muted-foreground">Sem dashboards lotados e sem caminhos escondidos. A próxima ação deve estar clara em poucos segundos.</p><Button asChild size="lg" className="mt-8"><Link href="/login">Acessar meu portal <ArrowRight className="size-4" /></Link></Button></section>
    </main>
    <footer className="border-t border-border"><div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8"><span className="flex items-center gap-2 font-medium text-foreground"><Logo className="size-4 text-primary" />Global English</span><span>© {new Date().getFullYear()} Global English Platform</span></div></footer>
  </div>
}
