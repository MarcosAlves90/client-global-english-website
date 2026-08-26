"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, TriangleAlert, UserRound } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/hooks/use-auth"
import { validateEmail, validateName, validatePassword } from "@/lib/auth/validators"
import { signUpWithEmail, toFriendlyAuthError } from "@/lib/firebase/auth"
import { cn } from "@/lib/utils"

export function SignupForm({
  className,
  isDisabled = false,
  ...props
}: React.ComponentProps<"div"> & { isDisabled?: boolean }) {
  const router = useRouter()
  const { isFirebaseReady } = useAuth()
  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [showPassword, setShowPassword] = React.useState(false)

  const handleSubmit = React.useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (isDisabled) {
      setError("O cadastro público está desativado.")
      return
    }

    const nameError = validateName(name)
    if (nameError) return setError(nameError)
    const emailError = validateEmail(email)
    if (emailError) return setError(emailError)
    const passwordError = validatePassword(password)
    if (passwordError) return setError(passwordError)
    if (password !== confirmPassword) return setError("As senhas não conferem.")
    if (!isFirebaseReady) return setError("Cadastro indisponível enquanto o Firebase não estiver configurado.")

    setIsSubmitting(true)
    try {
      await signUpWithEmail({ name, email, password })
      router.push("/dashboard")
    } catch (err) {
      setError(toFriendlyAuthError(err, "Não foi possível criar sua conta. Tente novamente."))
    } finally {
      setIsSubmitting(false)
    }
  }, [confirmPassword, email, isDisabled, isFirebaseReady, name, password, router])

  if (isDisabled) {
    return (
      <div className={cn("space-y-5", className)} {...props}>
        <div className="rounded-3xl border border-border bg-muted/45 p-5 sm:p-6">
          <div className="ge-icon-tile size-11">
            <ShieldCheck className="size-5" />
          </div>
          <h2 className="mt-4 text-lg font-semibold tracking-[-0.02em]">Contas são criadas pela equipe</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            O cadastro público permanece fechado. Alunos, professores e administradores recebem o acesso diretamente pela coordenação responsável.
          </p>
          <div className="mt-5 space-y-2 rounded-2xl bg-background/70 p-4 text-sm">
            <p className="font-medium text-foreground">Já recebeu suas credenciais?</p>
            <p className="text-muted-foreground">Use o login para acessar normalmente. Se ainda não recebeu, solicite o acesso à coordenação.</p>
          </div>
        </div>

        <Button asChild size="lg" className="w-full rounded-2xl">
          <Link href="/login">
            Ir para o login
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className={cn("space-y-6", className)} {...props}>
      <form onSubmit={handleSubmit}>
        <FieldGroup className="gap-5">
          <Field className="gap-2">
            <FieldLabel required htmlFor="name">Nome completo</FieldLabel>
            <div className="relative">
              <UserRound className="pointer-events-none absolute left-4 top-1/2 z-10 size-4 -translate-y-1/2 text-foreground/55" />
              <Input id="name" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Seu nome" className="h-12 rounded-2xl bg-background/75 pl-11 text-base shadow-none" required />
            </div>
          </Field>
          <Field className="gap-2">
            <FieldLabel required htmlFor="signup-email">E-mail</FieldLabel>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 z-10 size-4 -translate-y-1/2 text-foreground/55" />
              <Input id="signup-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="seu@email.com" className="h-12 rounded-2xl bg-background/75 pl-11 text-base shadow-none" required />
            </div>
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field className="gap-2">
              <FieldLabel required htmlFor="signup-password">Senha</FieldLabel>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 z-10 size-4 -translate-y-1/2 text-foreground/55" />
                <Input id="signup-password" type={showPassword ? "text" : "password"} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Sua senha" className="h-12 rounded-2xl bg-background/75 pl-11 pr-11 text-base shadow-none" required />
                <button type="button" className="absolute right-3 top-1/2 z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-foreground/55 hover:bg-muted hover:text-foreground" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}>
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </Field>
            <Field className="gap-2">
              <FieldLabel required htmlFor="confirm-password">Confirmar senha</FieldLabel>
              <Input id="confirm-password" type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Repita a senha" className="h-12 rounded-2xl bg-background/75 text-base shadow-none" required />
            </Field>
          </div>

          {error ? <div role="alert" className="flex items-start gap-2.5 rounded-2xl border border-destructive/20 bg-destructive/10 p-3.5 text-sm text-destructive"><TriangleAlert className="mt-0.5 size-4 shrink-0" />{error}</div> : null}

          <Button type="submit" size="lg" className="w-full rounded-2xl" disabled={isSubmitting}>
            {isSubmitting ? "Criando conta..." : "Criar conta"}
            {!isSubmitting ? <ArrowRight className="size-4" /> : null}
          </Button>
        </FieldGroup>
      </form>

      {!isFirebaseReady ? <FieldDescription className="text-center text-xs">Firebase não configurado. O cadastro real está indisponível.</FieldDescription> : null}
    </div>
  )
}
