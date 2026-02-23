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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
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
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Crie sua conta</CardTitle>
          <CardDescription>
            Cadastre-se para acompanhar suas trilhas e materiais.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name">Nome completo</FieldLabel>
                <Input
                  id="name"
                  type="text"
                  placeholder="Seu nome completo"
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  disabled={isDisabled}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={isDisabled}
                />
              </Field>
              <Field>
                <Field className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="password">Senha</FieldLabel>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      disabled={isDisabled}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="confirm-password">
                      Confirmar senha
                    </FieldLabel>
                    <Input
                      id="confirm-password"
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      disabled={isDisabled}
                    />
                  </Field>
                </Field>
                <FieldDescription>
                  Use ao menos 8 caracteres, com maiúscula, minúscula e número.
                </FieldDescription>
              </Field>
              <Field>
                <Button type="submit" disabled={isSubmitting || isDisabled}>
                  {isSubmitting ? "Criando..." : "Criar conta"}
                </Button>
                <FieldDescription className="text-center">
                  Já tem conta? <Link href="/login">Entrar</Link>
                </FieldDescription>
                {error ? (
                  <FieldDescription className="text-center text-destructive">
                    {error}
                  </FieldDescription>
                ) : null}
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        Ao continuar, você concorda com nossos{" "}
        <Link href="#">Termos de Uso</Link> e{" "}
        <Link href="#">Política de Privacidade</Link>.
      </FieldDescription>
      {!isFirebaseReady ? (
        <FieldDescription className="px-6 text-center text-xs text-muted-foreground">
          Firebase não configurado. Cadastro liberado para demo.
        </FieldDescription>
      ) : null}
    </div>
  )
}
