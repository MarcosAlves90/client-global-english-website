"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  requestPasswordReset,
  signInWithEmail,
  toFriendlyAuthError,
} from "@/lib/firebase/auth"
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

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const { isFirebaseReady } = useAuth()
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isResettingPassword, setIsResettingPassword] = React.useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
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
      setError(
        toFriendlyAuthError(err, "Email ou senha inválidos. Tente novamente.")
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handlePasswordReset() {
    setError(null)
    setSuccessMessage(null)

    if (!email.trim()) {
      setError("Informe seu email para recuperar a senha.")
      return
    }

    if (!isFirebaseReady) {
      setError("Recuperação indisponível enquanto o Firebase não estiver configurado.")
      return
    }

    setIsResettingPassword(true)
    try {
      await requestPasswordReset(email)
      setSuccessMessage("Enviamos um email com instruções para redefinir sua senha.")
    } catch (err) {
      setError(
        toFriendlyAuthError(
          err,
          "Não foi possível enviar o email de recuperação. Tente novamente."
        )
      )
    } finally {
      setIsResettingPassword(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Bem-vindo de volta</CardTitle>
          <CardDescription>
            Acesse seus cursos e trilhas de aprendizado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Senha</FieldLabel>
                  <button
                    type="button"
                    className="ml-auto text-sm text-muted-foreground underline-offset-4 hover:underline disabled:opacity-60"
                    onClick={handlePasswordReset}
                    disabled={isResettingPassword || isSubmitting}
                  >
                    {isResettingPassword ? "Enviando..." : "Esqueci minha senha"}
                  </button>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </Field>
              <Field>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Entrando..." : "Entrar"}
                </Button>
                <FieldDescription className="text-center">
                  Acesso restrito a contas autorizadas.
                </FieldDescription>
                {error ? (
                  <FieldDescription className="text-center text-destructive">
                    {error}
                  </FieldDescription>
                ) : null}
                {successMessage ? (
                  <FieldDescription className="text-center text-green-600">
                    {successMessage}
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
          Firebase não configurado. Acesso liberado para demo.
        </FieldDescription>
      ) : null}
    </div>
  )
}
