"use client"

import * as React from "react"
import { Bell, Moon, ShieldCheck, Sun, User } from "lucide-react"

import { DashboardHeader } from "@/components/dashboard-header"
import { useAuth } from "@/hooks/use-auth"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

export default function Page() {
  const { user, profile, isFirebaseReady } = useAuth()
  const [isDark, setIsDark] = React.useState(false)

  React.useEffect(() => {
    const root = document.documentElement
    const saved = localStorage.getItem("ge-theme")
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    const shouldUseDark = saved ? saved === "dark" : prefersDark
    setIsDark(shouldUseDark)
    root.classList.toggle("dark", shouldUseDark)
  }, [])

  const handleThemeToggle = React.useCallback((nextValue: boolean) => {
    setIsDark(nextValue)
    const root = document.documentElement
    root.classList.toggle("dark", nextValue)
    localStorage.setItem("ge-theme", nextValue ? "dark" : "light")
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "ge-theme",
        newValue: nextValue ? "dark" : "light",
      })
    )
  }, [])

  const displayName = React.useMemo(
    () => profile?.name ?? user?.displayName ?? "Usuário",
    [profile?.name, user?.displayName]
  )
  const email = React.useMemo(() => user?.email ?? "", [user?.email])

  return (
    <div>
      <DashboardHeader
        title="Configurações"
        description="Atualize seus dados e preferências pessoais."
      />

      <div className="flex flex-col gap-6 p-6">
        {!isFirebaseReady ? (
          <div className="rounded-2xl border border-dashed bg-accent/40 p-4 text-sm text-muted-foreground">
            Firebase não configurado. Alterações serão apenas locais.
          </div>
        ) : null}

        <Card>
          <CardContent className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="size-12">
                <AvatarImage src={user?.photoURL ?? ""} alt={displayName} />
                <AvatarFallback>{displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold">{displayName}</p>
                <p className="text-xs text-muted-foreground">{email}</p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              Atualizar foto
            </Button>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <CardHeader className="flex items-center gap-2">
              <User className="size-5 text-muted-foreground" />
              <CardTitle className="text-base">Dados pessoais</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  placeholder="Seu nome"
                  defaultValue={profile?.name ?? user?.displayName ?? ""}
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  placeholder="seu@email.com"
                  defaultValue={user?.email ?? ""}
                  disabled
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex items-center gap-2">
              <Bell className="size-5 text-muted-foreground" />
              <CardTitle className="text-base">Notificações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-2xl border p-4">
                <div>
                  <p className="text-sm font-medium">Alertas de atividades</p>
                  <p className="text-xs text-muted-foreground">
                    Avisos sobre novas tarefas e prazos.
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between rounded-2xl border p-4">
                <div>
                  <p className="text-sm font-medium">Relatório semanal</p>
                  <p className="text-xs text-muted-foreground">
                    Resumo do seu progresso toda sexta-feira.
                  </p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <CardHeader className="flex items-center gap-2">
              {isDark ? (
                <Moon className="size-5 text-muted-foreground" />
              ) : (
                <Sun className="size-5 text-muted-foreground" />
              )}
              <CardTitle className="text-base">Tema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-2xl border p-4">
                <div>
                  <p className="text-sm font-medium">
                    {isDark ? "Tema escuro" : "Tema claro"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isDark
                      ? "Reduz o brilho para ambientes com pouca luz."
                      : "Prioriza contraste alto para leitura diurna."}
                  </p>
                </div>
                <Switch checked={isDark} onCheckedChange={handleThemeToggle} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex items-center gap-2">
              <ShieldCheck className="size-5 text-muted-foreground" />
              <CardTitle className="text-base">Segurança</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="password">Nova senha</Label>
                <Input id="password" type="password" placeholder="********" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirmar senha</Label>
                <Input id="confirm" type="password" placeholder="********" />
              </div>
              <div className="md:col-span-2">
                <Button variant="outline">Atualizar senha</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
