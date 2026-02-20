import Link from "next/link"
import {
  ArrowRight,
  BookOpen,
  GraduationCap,
  Layers,
  ShieldCheck,
} from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-12">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm font-semibold">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              GE
            </span>
            Global English
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link className="text-muted-foreground hover:text-foreground" href="/login">
              Entrar
            </Link>
            <Link
              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-primary-foreground"
              href="/signup"
            >
              Criar conta <ArrowRight className="size-4" />
            </Link>
          </div>
        </header>

        <main className="flex flex-1 flex-col justify-center gap-16 py-16">
          <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-6">
              <p className="text-xs uppercase tracking-[0.3em] text-primary">
                Global English Platform
              </p>
              <h1 className="text-4xl font-semibold tracking-tight text-foreground lg:text-5xl">
                Cursos, trilhas e atividades reunidos em um painel claro e
                eficiente.
              </h1>
              <p className="text-base text-muted-foreground">
                Acompanhe o progresso, organize materiais e mantenha os alunos
                engajados com uma experiência profissional, feita para equipes e
                estudantes.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <Link
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-primary-foreground"
                  href="/signup"
                >
                  Começar agora <ArrowRight className="size-4" />
                </Link>
                <Link
                  className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
                  href="/login"
                >
                  Já tenho conta
                </Link>
              </div>
            </div>

            <div className="rounded-3xl border bg-card/70 p-8 shadow-sm">
              <div className="space-y-5">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Visão semanal</span>
                  <span>Atualizado hoje</span>
                </div>
                <div className="space-y-3">
                  {["Conversação avançada", "Business writing", "Listening lab"].map(
                    (item) => (
                      <div
                        key={item}
                        className="flex items-center justify-between rounded-2xl border bg-background px-4 py-3"
                      >
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {item}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Próxima entrega em 2 dias
                          </p>
                        </div>
                        <span className="rounded-full bg-muted px-3 py-1 text-xs">
                          68%
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-3xl border bg-card/70 p-6">
              <GraduationCap className="size-5 text-primary" />
              <h3 className="mt-4 text-base font-semibold">Cursos conectados</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Estruture módulos, níveis e objetivos para cada turma.
              </p>
            </div>
            <div className="rounded-3xl border bg-card/70 p-6">
              <Layers className="size-5 text-primary" />
              <h3 className="mt-4 text-base font-semibold">Trilhas claras</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Organize atividades por etapas, com prioridades e prazos.
              </p>
            </div>
            <div className="rounded-3xl border bg-card/70 p-6">
              <BookOpen className="size-5 text-primary" />
              <h3 className="mt-4 text-base font-semibold">Biblioteca viva</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Centralize materiais em PDF, vídeo, áudio e links.
              </p>
            </div>
            <div className="rounded-3xl border bg-card/70 p-6">
              <ShieldCheck className="size-5 text-primary" />
              <h3 className="mt-4 text-base font-semibold">Controle administrativo</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Defina permissões e acompanhe o desempenho dos alunos.
              </p>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}

