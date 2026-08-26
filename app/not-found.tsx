import Link from "next/link"
import { ArrowRight, SearchX } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Logo } from "@/components/ui/logo"

export default function NotFound() {
  return <main className="flex min-h-svh items-center justify-center bg-background px-6 py-12"><div className="w-full max-w-lg text-center"><div className="mx-auto flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Logo className="size-5" /></div><div className="ge-icon-tile mx-auto mt-10 size-12"><SearchX className="size-5" /></div><p className="mt-4 text-sm font-medium text-primary">Erro 404</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">Página não encontrada</h1><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">O endereço pode ter mudado ou não estar disponível. Volte para uma área conhecida da plataforma.</p><div className="mt-7 flex flex-col justify-center gap-2 sm:flex-row"><Button asChild><Link href="/dashboard">Ir para o dashboard <ArrowRight className="size-4" /></Link></Button><Button asChild variant="outline"><Link href="/">Voltar ao início</Link></Button></div></div></main>
}
