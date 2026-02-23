import Link from "next/link"
import { GraduationCap } from "lucide-react"

import { SignupForm } from "@/components/signup-form"

const isSignupDisabled =
  process.env.NEXT_PUBLIC_SIGNUP_ENABLED === "false"

export default function SignupPage() {
  return (
    <div className="min-h-svh bg-background">
      <div className="mx-auto grid min-h-svh max-w-6xl grid-cols-1 gap-10 px-6 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
        <div className="flex flex-col justify-between rounded-3xl border bg-muted/40 p-8 lg:p-10">
          <div className="flex items-center gap-3 text-sm font-medium">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <GraduationCap className="size-5" />
            </span>
            Global English
          </div>
          <div className="space-y-6">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Nova conta
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground lg:text-4xl">
              Crie sua base de estudos com trilhas personalizadas.
            </h1>
            <p className="text-base text-muted-foreground">
              Organize cursos, tarefas e materiais de forma clara para você e
              seu time. Tudo conectado em um só lugar.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span>Já tem conta?</span>
            <Link className="text-foreground underline-offset-4 hover:underline" href="/login">
              Entrar
            </Link>
          </div>
        </div>
        <div className="flex items-center justify-center">
          <div className="w-full max-w-md">
            <SignupForm isDisabled={isSignupDisabled} />
          </div>
        </div>
      </div>
    </div>
  )
}
