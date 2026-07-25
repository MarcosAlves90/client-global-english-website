"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { UserRoundPlus } from "lucide-react"
import { cn } from "@/lib/utils"
import { signUpWithEmail, toFriendlyAuthError } from "@/lib/firebase/auth"
import {
  validateEmail,
  validateName,
  validatePassword,
} from "@/lib/auth/validators"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

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

  const handleSubmit = React.useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (isDisabled) {
      setError("Cadastro temporariamente desativado.")
      return
    }

    const nameError = validateName(name)
    if (nameError) {
      setError(nameError)
      return
    }

    const emailError = validateEmail(email)
    if (emailError) {
      setError(emailError)
      return
    }

    const passwordError = validatePassword(password)
    if (passwordError) {
      setError(passwordError)
      return
    }

    if (password !== confirmPassword) {
      setError("As senhas não conferem.")
      return
    }

    if (!isFirebaseReady) {
      router.push("/dashboard")
      return
    }

    setIsSubmitting(true)

    try {
      await signUpWithEmail({ name, email, password })
      router.push("/dashboard")
    } catch (err) {
      setError(
        toFriendlyAuthError(err, "Não foi possível criar sua conta. Tente novamente.")
      )
    } finally {
      setIsSubmitting(false)
    }
  }, [name, email, password, confirmPassword, isDisabled, isFirebaseReady, router])

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden rounded-[1.5rem] border-border/70 bg-card/70 pt-0 shadow-2xl shadow-black/10 backdrop-blur-2xl">
        <div className="flex items-center gap-1.5 border-b border-border/60 bg-background/25 px-5 py-3" aria-hidden="true">
          <span className="size-2.5 rounded-full bg-[#ff5f57]" />
          <span className="size-2.5 rounded-full bg-[#febc2e]" />
          <span className="size-2.5 rounded-full bg-[#28c840]" />
          <span className="ml-2 text-[10px] font-medium tracking-wide text-muted-foreground/70">globalenglish.app / signup</span>
        </div>
        <CardHeader className="pb-4 pt-0 text-left sm:px-8 sm:pt-0">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex size-9 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
              <UserRoundPlus className="size-4" />
            </div>
            <span className="rounded-full border border-border/60 bg-background/40 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Invite only</span>
          </div>
          <CardTitle className="text-[1.7rem] font-semibold tracking-[-0.045em] text-foreground">
            Ative sua Conta
          </CardTitle>
          <CardDescription className="mt-2 text-sm leading-6 text-muted-foreground">
            O acesso é liberado pela coordenação da Global English.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6 sm:px-8 sm:pb-7">
          <form onSubmit={handleSubmit}>
            <FieldGroup className="gap-5">
              <Field className="gap-2">
                <FieldLabel required htmlFor="name" className="font-medium text-foreground">
                  Nome completo
                </FieldLabel>
                <Input
                  id="name"
                  type="text"
                  placeholder="Como gostaria de ser chamado"
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  disabled={isDisabled}
                  className="h-12 rounded-xl border-border/60 bg-background/50 focus-visible:ring-primary/40 focus-visible:border-primary transition-all text-base"
                />
              </Field>
              <Field className="gap-2">
                <FieldLabel required htmlFor="email" className="font-medium text-foreground">
                  E-mail institucional
                </FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@aluno.com"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={isDisabled}
                  className="h-12 rounded-xl border-border/60 bg-background/50 focus-visible:ring-primary/40 focus-visible:border-primary transition-all text-base"
                />
              </Field>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field className="gap-2">
                  <FieldLabel required htmlFor="password" className="font-medium text-foreground">
                    Criar Senha
                  </FieldLabel>
                  <Input
                    id="password"
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={isDisabled}
                    className="h-12 rounded-xl border-border/60 bg-background/50 focus-visible:ring-primary/40 focus-visible:border-primary transition-all text-base tracking-widest placeholder:tracking-normal"
                  />
                </Field>
                <Field className="gap-2">
                  <FieldLabel required htmlFor="confirm-password" className="font-medium text-foreground">
                    Confirmar
                  </FieldLabel>
                  <Input
                    id="confirm-password"
                    type="password"
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    disabled={isDisabled}
                    className="h-12 rounded-xl border-border/60 bg-background/50 focus-visible:ring-primary/40 focus-visible:border-primary transition-all text-base tracking-widest placeholder:tracking-normal"
                  />
                </Field>
              </div>
              <Field className="gap-2 pt-1">
                <Button
                  type="submit"
                  disabled={isSubmitting || isDisabled}
                  className="w-full h-12 rounded-xl font-semibold shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all text-base active:translate-y-0"
                >
                  {isSubmitting ? "Ativando..." : "Ativar minha conta"}
                </Button>
                {error ? (
                  <div className="rounded-lg bg-destructive/10 p-3 mt-4 border border-destructive/20 text-center text-sm font-medium text-destructive">
                    {error}
                  </div>
                ) : null}
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      <div className="text-center text-sm text-muted-foreground mt-4 space-y-4">
        <div>
          Já tem conta ativa?{" "}
          <Link href="/login" className="font-semibold text-foreground hover:text-primary transition-colors underline-offset-4 hover:underline">
            Faça login aqui
          </Link>
        </div>
      </div>
      {!isFirebaseReady ? (
        <FieldDescription className="px-6 text-center text-xs text-muted-foreground">
          Firebase não configurado. Conecte para usar autenticação real.
        </FieldDescription>
      ) : null}
    </div>
  )
}
