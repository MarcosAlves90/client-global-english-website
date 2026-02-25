"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Lock } from "lucide-react"

import { useAuth } from "@/hooks/use-auth"
import { updateCurrentUserPassword } from "@/lib/firebase/auth"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export default function UpdatePasswordPage() {
  const router = useRouter()
  const { user, loading, profile, isFirebaseReady, refreshProfile } = useAuth()
  const [password, setPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [showPassword, setShowPassword] = React.useState(false)
  const [showConfirm, setShowConfirm] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState<string | null>(null)
  const [submitting, setSubmitting] = React.useState(false)

  React.useEffect(() => {
    if (loading) return
    if (!user) {
      router.push("/login")
      return
    }
    if (!profile?.mustChangePassword) {
      router.push("/dashboard")
    }
  }, [loading, user, profile?.mustChangePassword, router])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSuccess(null)

    if (!isFirebaseReady) {
      setError("Atualização indisponível enquanto o Firebase não estiver configurado.")
      return
    }

    if (password !== confirmPassword) {
      setError("As senhas não conferem.")
      return
    }

    setSubmitting(true)
    try {
      await updateCurrentUserPassword({ password })
      await refreshProfile()
      setSuccess("Senha atualizada com sucesso.")
      router.push("/dashboard")
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message)
          : "Não foi possível atualizar a senha."
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading || !user || !profile?.mustChangePassword) {
    return null
  }

  return (
    <div className="min-h-svh bg-background">
      <div className="mx-auto flex min-h-svh max-w-4xl items-center justify-center px-6 py-10">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <Lock className="size-5" />
            </div>
            <CardTitle className="mt-4 text-xl">Crie uma nova senha</CardTitle>
            <CardDescription>
              Por segurança, atualize sua senha no primeiro acesso.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="new-password">Nova senha</FieldLabel>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      className="pr-10"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
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
                <Field>
                  <FieldLabel htmlFor="confirm-password">Confirmar senha</FieldLabel>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirm ? "text" : "password"}
                      className="pr-10"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
                      onClick={() => setShowConfirm((prev) => !prev)}
                      aria-label={showConfirm ? "Ocultar senha" : "Mostrar senha"}
                    >
                      {showConfirm ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                </Field>
                <Field>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Atualizando..." : "Atualizar senha"}
                  </Button>
                  {error ? (
                    <FieldDescription className="text-center text-destructive">
                      {error}
                    </FieldDescription>
                  ) : null}
                  {success ? (
                    <FieldDescription className="text-center text-green-600">
                      {success}
                    </FieldDescription>
                  ) : null}
                </Field>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
