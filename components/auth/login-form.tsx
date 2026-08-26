"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, CheckCircle2, Eye, EyeOff, LockKeyhole, Mail, TriangleAlert } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/hooks/use-auth"
import { requestPasswordReset, signInWithEmail, toFriendlyAuthError } from "@/lib/firebase/auth"
import { cn } from "@/lib/utils"

export function LoginForm({ className, ...props }: React.ComponentProps<"div">) {
  const router = useRouter()
  const { isFirebaseReady } = useAuth()
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isResettingPassword, setIsResettingPassword] = React.useState(false)
  const [showPassword, setShowPassword] = React.useState(false)

  const handleSubmit = React.useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSuccessMessage(null)

    if (!isFirebaseReady) {
      router.push("/dashboard")
      return
    }

    setIsSubmitting(true)
    try {
      await signInWithEmail({ email, password })
      router.push("/dashboard")
    } catch (err) {
      setError(toFriendlyAuthError(err, "Email ou senha inválidos. Tente novamente."))
    } finally {
      setIsSubmitting(false)
    }
  }, [email, password, isFirebaseReady, router])

  const handlePasswordReset = React.useCallback(async () => {
    setError(null)
    setSuccessMessage(null)

    if (!email.trim()) {
      setError("Informe seu email acima antes de solicitar a recuperação.")
      return
    }
    if (!isFirebaseReady) {
      setError("Recuperação indisponível enquanto o Firebase não estiver configurado.")
      return
    }

    setIsResettingPassword(true)
    try {
      await requestPasswordReset(email)
      setSuccessMessage("Enviamos as instruções de redefinição para o seu email.")
    } catch (err) {
      setError(toFriendlyAuthError(err, "Não foi possível enviar o email de recuperação. Tente novamente."))
    } finally {
      setIsResettingPassword(false)
    }
  }, [email, isFirebaseReady])

  return (
    <div className={cn("space-y-6", className)} {...props}>
      <form onSubmit={handleSubmit}>
        <FieldGroup className="gap-5">
          <Field className="gap-2">
            <FieldLabel required htmlFor="email" className="text-sm font-medium text-foreground">
              E-mail
            </FieldLabel>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 z-10 size-4 -translate-y-1/2 text-foreground/55" />
              <Input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="seu@email.com"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-12 rounded-2xl bg-background/75 pl-11 pr-4 text-base shadow-none"
              />
            </div>
          </Field>

          <Field className="gap-2">
            <div className="flex items-center justify-between gap-3">
              <FieldLabel required htmlFor="password" className="text-sm font-medium text-foreground">
                Senha
              </FieldLabel>
              <button
                type="button"
                className="rounded-lg px-1.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={handlePasswordReset}
                disabled={isResettingPassword || isSubmitting}
              >
                {isResettingPassword ? "Enviando..." : "Esqueci minha senha"}
              </button>
            </div>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 z-10 size-4 -translate-y-1/2 text-foreground/55" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                placeholder="Sua senha"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-12 rounded-2xl bg-background/75 pl-11 pr-12 text-base shadow-none"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-foreground/55 transition-colors hover:bg-muted hover:text-foreground"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </Field>

          {error ? (
            <div role="alert" className="flex items-start gap-2.5 rounded-2xl border border-destructive/20 bg-destructive/10 p-3.5 text-sm text-destructive">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}

          {successMessage ? (
            <div role="status" className="flex items-start gap-2.5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3.5 text-sm text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          ) : null}

          <Button type="submit" size="lg" className="w-full rounded-2xl" disabled={isSubmitting}>
            {isSubmitting ? "Entrando..." : "Entrar"}
            {!isSubmitting ? <ArrowRight className="size-4" /> : null}
          </Button>
        </FieldGroup>
      </form>

      <div className="border-t border-border/80 pt-5 text-center">
        <p className="text-sm text-muted-foreground">
          Precisa de acesso? <span className="font-medium text-foreground">Fale com a coordenação da Global English.</span>
        </p>
      </div>

      {!isFirebaseReady ? (
        <FieldDescription className="rounded-2xl bg-muted/55 px-4 py-3 text-center text-xs">
          Firebase não configurado. O ambiente local usará o fluxo de demonstração.
        </FieldDescription>
      ) : null}
    </div>
  )
}
