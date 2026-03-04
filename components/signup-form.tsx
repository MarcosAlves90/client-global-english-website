"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
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
      <Card className="border-border/50 shadow-xl shadow-primary/5 rounded-[2rem] bg-card/80 backdrop-blur-xl">
        <CardHeader className="text-center pt-8 pb-4">
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
            Ative sua Conta
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            Complete seu cadastro para acessar as trilhas.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
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
              <Field>
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
                <Field>
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
                <Field>
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
              <Field className="pt-4">
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

