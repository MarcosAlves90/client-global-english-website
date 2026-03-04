import Link from "next/link"
import { ArrowLeft, Compass, Home, SearchX } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Logo } from "@/components/ui/logo"

export default function NotFound() {
  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden bg-background px-6 py-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary)/0.18),transparent_45%),radial-gradient(circle_at_80%_0%,hsl(var(--accent)/0.14),transparent_40%),radial-gradient(circle_at_50%_100%,hsl(var(--primary)/0.1),transparent_55%)]"
      />

      <Card className="relative w-full max-w-xl border-primary/20 bg-card/70 py-0 shadow-2xl shadow-primary/10 backdrop-blur-md">
        <CardContent className="space-y-7 p-8 sm:p-10">
          <div className="flex items-center gap-3">
            <Logo className="size-9 text-primary" />
            <span className="text-lg font-bold tracking-tight text-foreground">
              Global English
            </span>
          </div>

          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-primary">
              <SearchX className="size-3.5" />
              Erro 404
            </div>
            <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
              Pagina nao encontrada
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
              O endereco acessado nao existe ou foi movido. Use os atalhos abaixo para
              voltar para uma area valida da plataforma.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Button className="w-full rounded-full font-semibold" asChild>
              <Link href="/">
                <Home className="mr-2 size-4" />
                Ir para inicio
              </Link>
            </Button>
            <Button variant="outline" className="w-full rounded-full font-semibold" asChild>
              <Link href="/dashboard">
                <Compass className="mr-2 size-4" />
                Ir para dashboard
              </Link>
            </Button>
          </div>

          <div className="border-t border-primary/10 pt-4">
            <Button variant="ghost" className="w-full rounded-full font-semibold" asChild>
              <Link href="/login">
                <ArrowLeft className="mr-2 size-4" />
                Voltar para login
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
