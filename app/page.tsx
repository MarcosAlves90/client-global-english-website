import type { Metadata } from "next"
import type { CSSProperties } from "react"
import Link from "next/link"
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  CirclePlay,
  Compass,
  Layers3,
  LockKeyhole,
  Target,
} from "lucide-react"
import { Logo } from "@/components/ui/logo"
import { DashboardMockup } from "@/components/landing/dashboard-mockup"
import { buildPageMetadata } from "@/lib/seo"

export const metadata: Metadata = buildPageMetadata({
  title: "Seu próximo nível começa aqui",
  description:
    "A plataforma da Global English reúne trilhas, materiais e atividades para você aprender inglês com mais clareza.",
  path: "/",
})

const benefits = [
  {
    icon: Compass,
    eyebrow: "01 / Direção",
    title: "Uma trilha que faz sentido",
    description:
      "Organize seus estudos por níveis, cursos e etapas. Você sempre sabe onde está e qual é o próximo passo.",
    accent: "from-sky-400/20 to-transparent",
  },
  {
    icon: BookOpen,
    eyebrow: "02 / Repertório",
    title: "Tudo o que você precisa, perto",
    description:
      "Encontre PDFs, vídeos, áudios e links complementares em uma biblioteca feita para acompanhar o seu ritmo.",
    accent: "from-violet-400/20 to-transparent",
  },
  {
    icon: Target,
    eyebrow: "03 / Evolução",
    title: "Progresso que dá para sentir",
    description:
      "Retome atividades, acompanhe suas entregas e transforme cada sessão em uma pequena conquista.",
    accent: "from-emerald-400/20 to-transparent",
  },
]

const steps = [
  { number: "01", title: "Entre", description: "Acesse seu portal com a sua conta Global English." },
  { number: "02", title: "Escolha o foco", description: "Abra sua trilha e encontre o material certo para hoje." },
  { number: "03", title: "Avance", description: "Complete as atividades e volte quando quiser continuar." },
]

export default function Home() {
  return (
    <div className="min-h-screen overflow-hidden bg-[#08090d] text-white selection:bg-violet-400/30">
      <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden="true">
        <div className="ge-orbit absolute left-1/2 top-[-26rem] h-[52rem] w-[52rem] -translate-x-1/2 rounded-full bg-violet-600/15 blur-[120px]" />
        <div className="ge-orbit ge-orbit-delayed absolute right-[-20rem] top-[32rem] h-[36rem] w-[36rem] rounded-full bg-sky-500/10 blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.035] [background-image:linear-gradient(rgba(255,255,255,.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.5)_1px,transparent_1px)] [background-size:64px_64px]" />
      </div>

      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <header className="flex items-center justify-between py-6 sm:py-8" aria-label="Navegação principal">
          <Link className="group flex items-center gap-3 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300" href="/" aria-label="Global English — início">
            <span className="flex size-9 items-center justify-center rounded-[11px] bg-white text-[#15151a] shadow-[0_0_24px_rgba(167,139,250,.24)] transition-transform group-hover:rotate-6 sm:size-10">
              <Logo className="size-5 sm:size-6" />
            </span>
            <span className="text-sm font-semibold tracking-[-0.02em] text-white/90 sm:text-base">Global English</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm sm:gap-7" aria-label="Links da página">
            <a className="hidden text-white/50 transition-colors hover:text-white sm:inline" href="#experiencia">Experiência</a>
            <a className="hidden text-white/50 transition-colors hover:text-white sm:inline" href="#como-funciona">Como funciona</a>
            <Link className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-4 py-2 text-xs font-medium text-white transition-colors hover:border-white/30 hover:bg-white/12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 sm:px-5 sm:py-2.5 sm:text-sm" href="/login">
              Acessar portal <ArrowRight className="size-3.5 sm:size-4" />
            </Link>
          </nav>
        </header>

        <main>
          <section className="grid items-center gap-14 pb-24 pt-16 sm:pb-32 sm:pt-24 lg:grid-cols-[minmax(0,.92fr)_minmax(480px,1.08fr)] lg:gap-16 lg:pt-28" aria-labelledby="hero-title">
            <div className="max-w-xl ge-reveal">
              <h1 id="hero-title" className="max-w-2xl text-[2.9rem] font-semibold leading-[1.03] tracking-[-0.065em] text-white sm:text-6xl lg:text-[4.5rem]">
                Aprender fica mais leve quando você sabe <span className="bg-linear-to-r from-violet-200 via-white to-sky-200 bg-clip-text text-transparent">por onde começar.</span>
              </h1>
              <p className="mt-7 max-w-lg text-base leading-7 text-white/55 sm:mt-8 sm:text-lg sm:leading-8">
                A Global English reúne sua trilha, seus materiais e suas atividades em um só lugar — com clareza para você avançar um dia de cada vez.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:items-center">
                <Link className="group inline-flex h-12 items-center justify-center gap-3 rounded-full bg-white px-6 text-sm font-semibold text-[#111218] shadow-[0_10px_40px_rgba(255,255,255,.12)] transition-all hover:-translate-y-0.5 hover:bg-violet-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#08090d] sm:h-13 sm:px-7" href="/login">
                  Entrar na plataforma <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <a className="inline-flex h-12 items-center justify-center gap-2 rounded-full px-5 text-sm font-medium text-white/55 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 sm:h-13" href="#experiencia">
                  Conhecer a experiência <ChevronRight className="size-4" />
                </a>
              </div>
              <div className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-white/10 pt-6 text-xs text-white/45 sm:mt-12">
                <span className="inline-flex items-center gap-2"><LockKeyhole className="size-3.5 text-emerald-300" /> Ambiente seguro</span>
                <span className="inline-flex items-center gap-2"><Layers3 className="size-3.5 text-sky-300" /> Conteúdo organizado</span>
              </div>
            </div>
            <DashboardMockup />
          </section>

          <section className="border-y border-white/10 py-5" aria-label="Resumo da experiência">
            <div className="grid gap-4 text-center text-xs text-white/45 sm:grid-cols-3 sm:divide-x sm:divide-white/10">
              <p><span className="font-medium text-white/85">Trilhas</span> para cada etapa</p>
              <p><span className="font-medium text-white/85">Materiais</span> no seu ritmo</p>
              <p><span className="font-medium text-white/85">Atividades</span> para praticar</p>
            </div>
          </section>

          <section id="experiencia" className="scroll-mt-8 py-24 sm:py-32" aria-labelledby="experience-title">
            <div className="mb-12 max-w-2xl sm:mb-16">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">Uma experiência com intenção</p>
              <h2 id="experience-title" className="text-3xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">Menos tempo procurando.<br /><span className="text-white/45">Mais tempo aprendendo.</span></h2>
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon
                return (
                  <article key={benefit.title} className="group relative min-h-[270px] overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-7 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.07] ge-reveal sm:p-8" style={{ "--enter-delay": `${index * 90}ms` } as CSSProperties}>
                    <div className={`pointer-events-none absolute inset-x-0 top-0 h-32 bg-linear-to-b ${benefit.accent} opacity-60 blur-2xl`} />
                    <div className="relative flex h-full flex-col">
                      <div className="flex items-center justify-between">
                        <div className="flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-violet-200"><Icon className="size-5" /></div>
                        <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/30">{benefit.eyebrow}</span>
                      </div>
                      <div className="mt-auto pt-12">
                        <h3 className="text-xl font-semibold tracking-[-0.03em] text-white">{benefit.title}</h3>
                        <p className="mt-3 text-sm leading-6 text-white/50">{benefit.description}</p>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          </section>

          <section id="como-funciona" className="scroll-mt-8 border-t border-white/10 py-24 sm:py-32" aria-labelledby="steps-title">
            <div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr] lg:gap-24">
              <div>
                <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-sky-300">Seu próximo passo</p>
                <h2 id="steps-title" className="text-3xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">Um caminho simples para manter o ritmo.</h2>
                <p className="mt-6 max-w-md text-base leading-7 text-white/50">A plataforma acompanha o seu momento sem complicar. Você entra, encontra o foco e volta a avançar.</p>
              </div>
              <div className="divide-y divide-white/10 rounded-[1.75rem] border border-white/10 bg-white/[0.035] px-6 sm:px-9">
                {steps.map((step) => (
                  <div className="flex gap-5 py-6 sm:gap-8 sm:py-7" key={step.number}>
                    <span className="pt-1 font-mono text-xs text-violet-300/80">{step.number}</span>
                    <div><h3 className="text-base font-semibold text-white">{step.title}</h3><p className="mt-1.5 text-sm leading-6 text-white/45">{step.description}</p></div>
                    <Check className="ml-auto mt-1 size-4 shrink-0 text-emerald-300/80" />
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="relative mb-20 overflow-hidden rounded-[2rem] border border-white/15 bg-linear-to-br from-violet-400/20 via-white/[0.07] to-sky-400/10 px-6 py-16 text-center sm:mb-28 sm:rounded-[2.5rem] sm:px-10 sm:py-24" aria-labelledby="closing-title">
            <div className="pointer-events-none absolute left-1/2 top-0 size-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-300/15 blur-[90px]" />
            <div className="relative mx-auto max-w-2xl ge-reveal">
              <CirclePlay className="mx-auto mb-6 size-8 text-violet-200" />
              <h2 id="closing-title" className="text-3xl font-semibold tracking-[-0.05em] text-white sm:text-5xl">Seu próximo nível está a um login de distância.</h2>
              <p className="mx-auto mt-5 max-w-lg text-sm leading-6 text-white/55 sm:text-base">Abra sua trilha, retome de onde parou e faça o inglês caber na sua rotina.</p>
              <Link className="mt-8 inline-flex h-12 items-center gap-3 rounded-full bg-white px-7 text-sm font-semibold text-[#111218] transition-all hover:-translate-y-0.5 hover:bg-violet-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#15131d]" href="/login">Acessar meu portal <ArrowRight className="size-4" /></Link>
            </div>
          </section>
        </main>

        <footer className="flex flex-col gap-4 border-t border-white/10 py-7 text-xs text-white/35 sm:flex-row sm:items-center sm:justify-between sm:py-8">
          <Link className="flex items-center gap-2 font-medium text-white/55" href="/" aria-label="Voltar ao início"><Logo className="size-4" /> Global English</Link>
          <p>© {new Date().getFullYear()} Global English Platform · Área exclusiva para alunos</p>
        </footer>
      </div>
    </div>
  )
}
