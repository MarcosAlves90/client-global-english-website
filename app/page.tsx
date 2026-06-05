import type { Metadata } from "next"
import Link from "next/link"
import {
  ArrowRight,
  BookOpen,
  GraduationCap,
  Layers,
  ShieldCheck,
  Sparkles,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarGroup, AvatarImage } from "@/components/ui/avatar"
import { Logo } from "@/components/ui/logo"
import { DashboardMockup } from "@/components/landing/dashboard-mockup"
import { buildCloudinaryUrl, readCloudinaryPublicIdsEnv } from "@/lib/cloudinary-url"
import { buildPageMetadata } from "@/lib/seo"

export const metadata: Metadata = buildPageMetadata({
  title: "Portal do Aluno de Inglês",
  description:
    "Acesse a plataforma da Global English para acompanhar trilhas, materiais e evolução no inglês em um só lugar.",
  path: "/",
})

// Hoisted static features array out of the render cycle
const featuresList = [
  {
    icon: GraduationCap,
    title: "Cursos Conectados",
    description: "Trilhas completas com níveis e objetivos desenhados sob medida para o seu perfil."
  },
  {
    icon: Layers,
    title: "Passo a Passo",
    description: "Saiba exatamente o que fazer a seguir com trilhas claras, prioridades e prazos bem definidos."
  },
  {
    icon: BookOpen,
    title: "Biblioteca Viva",
    description: "Acesso instantâneo aos seus materiais em PDF, vídeos, áudios e links complementares."
  },
  {
    icon: ShieldCheck,
    title: "100% Seguro",
    description: "Uma conta única, segura e exclusiva com todo o histórico do seu desempenho salvo na nuvem."
  },
]

const socialProofAvatarPublicIds = readCloudinaryPublicIdsEnv(
  "NEXT_PUBLIC_HOME_AVATAR_PUBLIC_IDS"
)

const socialProofAvatars = socialProofAvatarPublicIds.map((publicId) =>
  buildCloudinaryUrl(publicId)
)

export default function Home() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      {/* Abstract Background Elements */}
      <div className="pointer-events-none absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
        <div className="relative left-[calc(50%-11rem)] aspect-1155/678 w-144.5 -translate-x-1/2 rotate-30 bg-linear-to-tr from-primary to-[#ff80b5] opacity-20 sm:left-[calc(50%-30rem)] sm:w-289" style={{ clipPath: "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)" }} />
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-col px-4 py-4 sm:px-6 md:py-10 flex-1">
        {/* Header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between z-10 relative">
          <Link
            className="flex items-center gap-3 text-sm font-bold tracking-tight transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-background rounded-full"
            href="/"
            aria-label="Ir para a página inicial da Global English"
          >
            <Logo className="size-9 sm:size-10 text-primary" />
            <span className="text-lg sm:text-xl">Global English</span>
          </Link>
          <div className="flex items-center justify-between gap-3 text-sm font-medium sm:justify-end sm:gap-4">
            <Link
              className="hidden md:inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              href="/login"
            >
              Já sou aluno
            </Link>
            <Link
              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-primary-foreground shadow-md hover:bg-primary/90 transition-all hover:scale-105 active:scale-95 sm:px-5 sm:py-2.5"
              href="/login"
            >
              Acessar Painel <ArrowRight className="size-4" />
            </Link>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex flex-1 flex-col justify-center gap-20 py-12 sm:gap-24 sm:py-16 md:py-24 z-10 relative">

          {/* Hero Section */}
          <section className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] items-center">
            <div className="space-y-8 sm:space-y-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs sm:text-sm text-primary backdrop-blur-sm">
                <Sparkles className="size-4" />
                <span className="font-medium tracking-wide">Plataforma Exclusiva para Alunos</span>
              </div>

              <h1 className="max-w-2xl text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-7xl text-balance leading-[1.08]">
                Seu inglês num só <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-accent">lugar.</span>
              </h1>

              <p className="max-w-xl text-base text-muted-foreground text-balance leading-relaxed sm:text-lg">
                Acesse todos os seus materiais, acompanhe seu progresso e encontre os links das aulas de maneira rápida, organizada e sem distrações.
              </p>

              <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
                <Link
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-xl shadow-primary/25 transition-all hover:bg-primary/90 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/30 active:translate-y-0 sm:h-14 sm:w-auto sm:px-8 sm:text-base"
                  href="/login"
                >
                  Entrar na Plataforma <ArrowRight className="size-5" />
                </Link>
              </div>

              {/* Social Proof Pattern (Bandwagon Effect) */}
              <div className="flex flex-col gap-4 pt-8 border-t border-border/50 sm:flex-row sm:items-center sm:gap-4">
                <AvatarGroup className="justify-start">
                  <Avatar className="size-9 ring-background border-2 border-background sm:size-10">
                    <AvatarImage src={socialProofAvatars[0]} />
                    <AvatarFallback>A1</AvatarFallback>
                  </Avatar>
                  <Avatar className="size-9 ring-background border-2 border-background sm:size-10">
                    <AvatarImage src={socialProofAvatars[1]} />
                    <AvatarFallback>A2</AvatarFallback>
                  </Avatar>
                  <Avatar className="size-9 ring-background border-2 border-background sm:size-10">
                    <AvatarImage src={socialProofAvatars[2]} />
                    <AvatarFallback>A3</AvatarFallback>
                  </Avatar>
                  <Avatar className="size-9 ring-background border-2 border-background sm:size-10">
                    <AvatarImage src={socialProofAvatars[3]} />
                    <AvatarFallback>A4</AvatarFallback>
                  </Avatar>
                </AvatarGroup>
                <div className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">Junte-se aos alunos</span> que já estão evoluindo.
                </div>
              </div>
            </div>

            {/* Visual Glassmorphic Dashboard Mockup */}
            <DashboardMockup />
          </section>

          {/* Features Section (Cognitive Ease Pattern) */}
          <section className="space-y-14">
            <div className="text-center space-y-4 max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold tracking-tight sm:text-4xl text-foreground">
                Tudo desenhado para a sua <span className="text-primary">fluência.</span>
              </h2>
              <p className="text-sm text-muted-foreground text-balance sm:text-lg">
                Eliminamos a complexidade. Focamos no que importa: seu aprendizado.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 sm:gap-7">
              {featuresList.map((feature, i) => (
                <div key={i} className="group rounded-3xl border bg-card/40 p-7 transition-all hover:-translate-y-2 hover:bg-card hover:shadow-xl hover:shadow-primary/5 sm:p-8">
                  <div className="mb-6 inline-flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 sm:size-12">
                    <feature.icon className="size-6" />
                  </div>
                  <h3 className="text-base font-bold text-foreground sm:text-lg">{feature.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Bottom CTA Section */}
          <section className="relative overflow-hidden rounded-[2rem] bg-foreground text-background py-14 px-5 text-center shadow-2xl sm:rounded-[2.5rem] sm:px-6 sm:py-18 md:px-12">
            <div className="absolute inset-0 bg-linear-to-br from-primary/20 via-transparent to-accent/20 opacity-50"></div>
            <div className="relative z-10 mx-auto max-w-2xl space-y-8 sm:space-y-10">
              <h2 className="text-2xl font-bold tracking-tight text-background sm:text-5xl">
                Pronto para retomar os estudos?
              </h2>
              <p className="text-sm text-muted/80 sm:text-lg">
                Acesse o seu portal do aluno, confira os materiais atualizados desta semana e continue trilhando a sua fluência.
              </p>
              <Link
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90 hover:scale-105 active:scale-95 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] sm:h-14 sm:px-8 sm:text-base"
                href="/login"
              >
                Entrar com minha conta <ArrowRight className="size-5" />
              </Link>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="py-6 text-center text-xs text-muted-foreground z-10 relative sm:py-8 sm:text-sm">
          <p>© {new Date().getFullYear()} Global English Platform. Área Exclusiva para Alunos.</p>
        </footer>
      </div>
    </div>
  )
}
