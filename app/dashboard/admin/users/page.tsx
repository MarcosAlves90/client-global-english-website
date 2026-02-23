"use client"

import * as React from "react"
import { Mail, UserCheck, Users2, Eye, Edit, Snowflake, Flame, Trash2, ShieldCheck, User } from "lucide-react"

import { DashboardHeader } from "@/components/dashboard-header"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
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
  disabled?: boolean
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
    disabled: false,
  })
  const [saving, setSaving] = React.useState(false)
  const [formError, setFormError] = React.useState<string | null>(null)
  const [searchQuery, setSearchQuery] = React.useState("")

  React.useEffect(() => {
    if (!isFirebaseReady || role !== "admin") {
      return
    }

    let isMounted = true

    const loadUsers = async () => {
      try {
        setLoading(true)
        setError(null)
        const idToken = user ? await user.getIdToken() : null
        const resp = await fetch("/api/admin/users", {
          headers: {
            ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
          },
        })
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
  }, [isFirebaseReady, role, user])

  React.useEffect(() => {
    if (selectedUser) {
      setForm({ ...selectedUser })
      setFormError(null)
    } else {
      setForm({
        uid: "",
        name: "",
        email: "",
        role: "user",
        team: "",
        disabled: false,
      })
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

  const filteredUsers = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return users
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query)
    )
  }, [users, searchQuery])

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
      disabled: user.disabled,
    })
  }

  const handleCancelEdit = () => {
    setSelectedUser(null)
  }

  const handleFreeze = async (target: AdminUserSummary) => {
    const idToken = user ? await user.getIdToken() : null
    try {
      const resp = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({ uid: target.uid, disabled: !target.disabled }),
      })
      if (!resp.ok) throw new Error("freeze failed")
      setUsers((prev) =>
        prev.map((u) =>
          u.uid === target.uid ? { ...u, disabled: !target.disabled } : u
        )
      )
      if (selectedUser?.uid === target.uid) {
        setSelectedUser((prev) =>
          prev ? { ...prev, disabled: !target.disabled } : prev
        )
      }
    } catch {
      setError("Não foi possível alterar o estado do usuário.")
    }
  }

  const handleDelete = async (target: AdminUserSummary) => {
    if (!confirm(`Excluir usuário ${target.name}?`)) {
      return
    }
    const idToken = user ? await user.getIdToken() : null
    try {
      const resp = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({ uid: target.uid }),
      })
      if (!resp.ok) throw new Error("delete failed")
      setUsers((prev) => prev.filter((u) => u.uid !== target.uid))
    } catch {
      setError("Não foi possível excluir o usuário.")
    }
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
        // editing existing user through API so auth profile updates as well
        const idToken = user ? await user.getIdToken() : null
        const resp = await fetch("/api/admin/users", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
          },
          body: JSON.stringify({
            uid: selectedUser.uid,
            name: form.name.trim(),
            email: form.email.trim(),
            role: form.role,
            team: form.team.trim() || null,
          }),
        })
        if (!resp.ok) throw new Error("failed to update")

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
        // creating new user
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
        if (!resp.ok) throw new Error("Failed to create")
        const newUser = (await resp.json()) as AdminUserSummary
        setUsers((prev) =>
          [...prev, newUser].sort((a, b) => a.name.localeCompare(b.name))
        )
        setForm({
          uid: "",
          name: "",
          email: "",
          role: "user",
          team: "",
          disabled: false,
        })
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
              <Input
                placeholder="Buscar por nome ou email"
                className="h-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSearchQuery("")}
              >
                Limpar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
                Carregando usuários...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
                {searchQuery ? "Nenhum usuário corresponde à busca." : "Nenhum usuário encontrado."}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredUsers.map((item) => {
                  const isSelected = selectedUser?.uid === item.uid
                  const isAdmin = item.role === "admin"
                  const isDisabled = item.disabled

                  return (
                    <div
                      key={item.uid}
                      className={cn(
                        "relative flex flex-col group rounded-xl border bg-card p-3 transition-all duration-300",
                        "hover:shadow-md hover:border-accent-foreground/30",
                        isSelected 
                          ? "ring-2 ring-primary border-primary bg-primary/5 shadow-sm" 
                          : "border-border",
                        isDisabled && "grayscale-[0.8] opacity-80"
                      )}
                    >
                      <div className="flex items-start gap-3 mb-2">
                        <div className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-full transition-colors duration-500",
                          isAdmin ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                          isSelected && "bg-primary text-primary-foreground"
                        )}>
                          {isAdmin ? <ShieldCheck className="size-4" /> : <User className="size-4" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <p className={cn(
                              "truncate text-sm font-bold tracking-tight",
                              isSelected ? "text-primary" : "text-foreground"
                            )}>
                              {item.name}
                            </p>
                            {isAdmin && (
                              <ShieldCheck className="size-3 text-primary shrink-0" title="Admin" />
                            )}
                          </div>
                          <p className="truncate text-[11px] text-muted-foreground">
                            {item.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mb-2">
                        <span className={cn(
                          "inline-flex items-center rounded-md px-1 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                          isAdmin 
                            ? "bg-primary/20 text-primary border border-primary/20" 
                            : "bg-secondary text-secondary-foreground"
                        )}>
                          {ROLE_LABELS[item.role]}
                        </span>
                        
                        {isDisabled && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-blue-100 px-1 py-0.5 text-[9px] font-bold uppercase tracking-wider text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                            <Snowflake className="size-2" />
                            OFF
                          </span>
                        )}
                      </div>

                      <div className="mt-auto flex items-center justify-between gap-1 border-t border-dashed pt-2 group-hover:border-accent-foreground/10">
                        <div className="flex items-center gap-1">
                          <Button 
                            size="icon-xs" 
                            variant="ghost" 
                            className="size-7 rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
                            onClick={() => {/* TODO profile view */}}
                          >
                            <Eye className="size-3.5" />
                          </Button>
                          <Button 
                            size="icon-xs" 
                            variant="ghost"
                            className={cn(
                              "size-7 rounded-full transition-colors",
                              isSelected ? "bg-primary/10 text-primary" : "hover:bg-primary/10 hover:text-primary"
                            )}
                            onClick={() => handleEditUser(item)}
                          >
                            <Edit className="size-3.5" />
                          </Button>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon-xs"
                            className={cn(
                              "size-7 rounded-full shadow-none border-none transition-transform active:scale-90",
                              isDisabled
                                ? "bg-yellow-400 hover:bg-yellow-500 text-amber-950"
                                : "bg-blue-500 hover:bg-blue-600 text-white"
                            )}
                            onClick={() => handleFreeze(item)}
                          >
                            {isDisabled ? <Flame className="size-3.5" /> : <Snowflake className="size-3.5" />}
                          </Button>
                          <Button
                            size="icon-xs"
                            variant="destructive"
                            className="size-7 rounded-full hover:rotate-12 transition-transform active:scale-90"
                            onClick={() => handleDelete(item)}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
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
          <CardHeader className="py-4">
            <CardTitle className="text-base">Ações rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border border-dashed p-4 text-center text-xs text-muted-foreground">
              Ações automáticas serão exibidas quando houver dados.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


