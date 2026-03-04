"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"
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
      setError(
        toFriendlyAuthError(err, "Email ou senha inválidos. Tente novamente.")
      )
    } finally {
      setIsSubmitting(false)
    }
  }, [email, password, isFirebaseReady, router])

  const handlePasswordReset = React.useCallback(async () => {
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
  }, [email, isFirebaseReady])

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="border-border/50 shadow-xl shadow-primary/5 rounded-[2rem] bg-card/80 backdrop-blur-xl">
        <CardHeader className="text-center pt-8 pb-4">
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
            Acesso ao Portal
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            Insira suas credenciais para entrar na plataforma.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel required htmlFor="email" className="font-medium text-foreground">
                  E-mail
                </FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="h-12 rounded-xl border-border/60 bg-background/50 focus-visible:ring-primary/40 focus-visible:border-primary transition-all text-base"
                />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel required htmlFor="password" className="font-medium text-foreground">
                    Senha
                  </FieldLabel>
                  <button
                    type="button"
                    className="ml-auto text-sm font-medium text-primary hover:text-primary/80 transition-colors disabled:opacity-60"
                    onClick={handlePasswordReset}
                    disabled={isResettingPassword || isSubmitting}
                  >
                    {isResettingPassword ? "Enviando..." : "Esqueci minha senha"}
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    className="h-12 rounded-xl pr-10 border-border/60 bg-background/50 focus-visible:ring-primary/40 focus-visible:border-primary transition-all text-base tracking-widest placeholder:tracking-normal"
                    placeholder="••••••••"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground p-1 rounded-md hover:bg-muted"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </Field>
              <Field className="pt-2">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 rounded-xl font-semibold shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all text-base active:translate-y-0"
                >
                  {isSubmitting ? "Entrando..." : "Acessar Plataforma"}
                </Button>
                {error ? (
                  <div className="rounded-lg bg-destructive/10 p-3 mt-4 border border-destructive/20 text-center text-sm font-medium text-destructive">
                    {error}
                  </div>
                ) : null}
                {successMessage ? (
                  <div className="rounded-lg bg-green-500/10 p-3 mt-4 border border-green-500/20 text-center text-sm font-medium text-green-700 dark:text-green-400">
                    {successMessage}
                  </div>
                ) : null}
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      <div className="text-center text-sm text-muted-foreground mt-4 space-y-4">
        <div>
          Não tem uma conta?{" "}
          <Link href="/signup" className="font-semibold text-foreground hover:text-primary transition-colors underline-offset-4 hover:underline">
            Fale com a coordenação
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

