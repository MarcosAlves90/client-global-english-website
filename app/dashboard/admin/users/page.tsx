"use client"

import * as React from "react"
import { Mail, UserCheck, Users2 } from "lucide-react"

import { DashboardHeader } from "@/components/dashboard-header"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { AdminUserSummary } from "@/lib/firebase/types"

const ROLE_LABELS = {
  admin: "Admin",
  user: "Aluno",
}

type EditableUser = {
  uid: string
  name: string
  email: string
  role: "admin" | "user"
  team: string
}

const selectClassName =
  "bg-card text-foreground border-input h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"

export default function Page() {
  const { role, isFirebaseReady, user } = useAuth()
  const [users, setUsers] = React.useState<AdminUserSummary[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [selectedUser, setSelectedUser] = React.useState<EditableUser | null>(
    null
  )
  const [form, setForm] = React.useState<EditableUser>({
    uid: "",
    name: "",
    email: "",
    role: "user",
    team: "",
  })
  const [saving, setSaving] = React.useState(false)
  const [formError, setFormError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!isFirebaseReady || role !== "admin") {
      return
    }

    let isMounted = true

    const loadUsers = async () => {
      try {
        setLoading(true)
        setError(null)
        const resp = await fetch("/api/admin/users")
        if (!resp.ok) throw new Error("failed to load")
        const data: AdminUserSummary[] = await resp.json()
        if (isMounted) {
          setUsers(data)
        }
      } catch {
        if (isMounted) {
          setError("Não foi possível carregar os usuários.")
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadUsers()

    return () => {
      isMounted = false
    }
  }, [isFirebaseReady, role])

  React.useEffect(() => {
    if (selectedUser) {
      setForm({ ...selectedUser })
      setFormError(null)
    } else {
      setForm({ uid: "", name: "", email: "", role: "user", team: "" })
      setFormError(null)
    }
  }, [selectedUser])

  if (role !== "admin") {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Acesso restrito</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Esta área é exclusiva para administradores.
          </CardContent>
        </Card>
      </div>
    )
  }

  const totalUsers = users.length
  const adminUsers = users.filter((user) => user.role === "admin").length
  const teamOptions = Array.from(
    new Set(
      users
        .map((user) => user.team)
        .filter((team): team is string => Boolean(team && team.trim()))
        .map((team) => team.trim())
    )
  ).sort((a, b) => a.localeCompare(b))

  const handleEditUser = (user: AdminUserSummary) => {
    setSelectedUser({
      uid: user.uid,
      name: user.name,
      email: user.email,
      role: user.role,
      team: user.team ?? "",
    })
  }

  const handleCancelEdit = () => {
    setSelectedUser(null)
  }

  const handleSave = async () => {
    // validation
    if (!form.name.trim() || !form.email.trim()) {
      setFormError("Nome e email são obrigatórios.")
      return
    }

    setSaving(true)
    setFormError(null)

    try {
      if (selectedUser) {
        // editing existing user
        await updateAdminUser({
          uid: selectedUser.uid,
          name: form.name.trim(),
          email: form.email.trim(),
          role: form.role,
          team: form.team.trim() || null,
        })

        setUsers((prev) =>
          prev.map((user) =>
            user.uid === selectedUser.uid
              ? {
                  ...user,
                  name: form.name.trim(),
                  email: form.email.trim(),
                  role: form.role,
                  team: form.team.trim() || null,
                }
              : user
          )
        )

        setSelectedUser(null)
      } else {
        // create via server-side endpoint so that an auth user is created too
        // attach ID token so server can verify admin status
        const idToken = user ? await user.getIdToken() : null
        const resp = await fetch("/api/admin/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
          },
          body: JSON.stringify({
            name: form.name.trim(),
            email: form.email.trim(),
            role: form.role,
            team: form.team.trim() || null,
          }),
        })
        if (!resp.ok) {
          throw new Error((await resp.json()).error || "Failed to create")
        }
        const newUser = (await resp.json()) as AdminUserSummary
        setUsers((prev) =>
          [...prev, newUser].sort((a, b) => a.name.localeCompare(b.name))
        )
        setForm({ uid: "", name: "", email: "", role: "user", team: "" })
      }
    } catch {
      setFormError(
        selectedUser
          ? "Não foi possível salvar as alterações."
          : "Não foi possível criar o usuário."
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <DashboardHeader
        title="Usuários"
        description="Gerencie alunos, instrutores e permissões da plataforma."
        action={
          <Button size="sm" onClick={() => setSelectedUser(null)}>
            Convidar usuário
          </Button>
        }
      />

      <div className="flex flex-col gap-6 p-6">
        {!isFirebaseReady ? (
          <div className="rounded-2xl border border-dashed bg-accent/40 p-4 text-sm text-muted-foreground">
            Firebase não configurado. Conecte para visualizar usuários reais.
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-dashed border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <Card>
          <CardHeader className="flex items-center justify-between gap-3 sm:flex-row">
            <div>
              <CardTitle className="text-base">Base de usuários</CardTitle>
              <p className="text-sm text-muted-foreground">
                Acompanhe convites e status de acesso.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Input placeholder="Buscar por nome ou email" className="h-9" />
              <Button size="sm" variant="outline">
                Filtrar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
                Carregando usuários...
              </div>
            ) : users.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
                Nenhum usuário encontrado.
              </div>
            ) : (
              users.map((user) => (
                <div
                  key={user.uid}
                  className="flex flex-col gap-3 rounded-2xl border p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="rounded-full bg-muted px-3 py-1">
                      {ROLE_LABELS[user.role]}
                    </span>
                    <span className="rounded-full bg-muted px-3 py-1">Ativo</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline">
                      Ver perfil
                    </Button>
                    <Button size="sm" onClick={() => handleEditUser(user)}>
                      Editar
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {selectedUser ? "Editar usuário" : "Cadastrar novo usuário"}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="new-user-name">Nome completo</Label>
              <Input
                id="new-user-name"
                placeholder="Nome do usuário"
                value={form.name}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, name: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-user-email">Email</Label>
              <Input
                id="new-user-email"
                type="email"
                placeholder="usuario@empresa.com"
                value={form.email}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, email: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-user-role">Perfil</Label>
              <select
                id="new-user-role"
                className={selectClassName}
                value={form.role}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    role: event.target.value === "admin" ? "admin" : "user",
                  }))
                }
              >
                <option value="user">Aluno</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-user-team">Equipe</Label>
              <Input
                id="new-user-team"
                placeholder="Turma ou time"
                value={form.team}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, team: event.target.value }))
                }
                list="team-options"
              />
              <datalist id="team-options">
                {teamOptions.map((team) => (
                  <option key={team} value={team} />
                ))}
              </datalist>
            </div>
            {formError ? (
              <div className="md:col-span-2 text-sm text-destructive">
                {formError}
              </div>
            ) : null}
            <div className="md:col-span-2 flex items-center gap-2">
              <Button onClick={handleSave} disabled={saving}>
                {saving
                  ? selectedUser
                    ? "Salvando..."
                    : "Criando..."
                  : selectedUser
                  ? "Salvar usuário"
                  : "Criar usuário"}
              </Button>
              <Button variant="outline" onClick={handleCancelEdit}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            { label: "Usuários ativos", value: totalUsers, icon: Users2 },
            { label: "Convites pendentes", value: "-", icon: Mail },
            { label: "Admins", value: adminUsers, icon: UserCheck },
          ].map((item) => (
            <Card key={item.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium">{item.label}</CardTitle>
                <item.icon className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">{item.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ações rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
              Ações automáticas serão exibidas quando houver dados.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


