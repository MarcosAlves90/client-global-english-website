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
import {
  AdminUserCard,
  deleteAdminUser,
  fetchAdminUsersPage,
  toggleAdminUserDisabled,
  upsertAdminUser,
  type CreateAdminUserResponse,
  type AdminUsersPageResponse,
} from "@/modules/users"

const USERS_PAGE_SIZE = 12
const ROOT_CURSOR = "__root__"

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
  const [generatedPassword, setGeneratedPassword] = React.useState<string | null>(
    null
  )
  const [searchQuery, setSearchQuery] = React.useState("")
  const [nextCursor, setNextCursor] = React.useState<string | null>(null)
  const [currentCursor, setCurrentCursor] = React.useState<string | null>(null)
  const [cursorHistory, setCursorHistory] = React.useState<string[]>([])
  const [page, setPage] = React.useState(1)

  const loadUsersPage = React.useCallback(
    async (cursor: string | null) => {
      try {
        setLoading(true)
        setError(null)
        const idToken = user ? await user.getIdToken() : null
        const data = (await fetchAdminUsersPage({
          idToken,
          pageSize: USERS_PAGE_SIZE,
          cursor,
        })) as AdminUsersPageResponse
        setUsers(data.items)
        setNextCursor(data.nextCursor)
      } catch {
        setError("Não foi possível carregar os usuários.")
      } finally {
        setLoading(false)
      }
    },
    [user]
  )

  React.useEffect(() => {
    if (!isFirebaseReady || role !== "admin") {
      return
    }

    setCurrentCursor(null)
    setCursorHistory([])
    setPage(1)
    void loadUsersPage(null)
  }, [isFirebaseReady, role, loadUsersPage])

  React.useEffect(() => {
    if (selectedUser) {
      setForm({ ...selectedUser })
      setFormError(null)
      setGeneratedPassword(null)
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
      setGeneratedPassword(null)
    }
  }, [selectedUser])

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

  const hasPreviousPage = cursorHistory.length > 0
  const hasNextPage = Boolean(nextCursor)

  const handleNextPage = async () => {
    if (!nextCursor || loading) {
      return
    }

    setCursorHistory((prev) => [...prev, currentCursor ?? ROOT_CURSOR])
    setCurrentCursor(nextCursor)
    setPage((prev) => prev + 1)
    await loadUsersPage(nextCursor)
  }

  const handlePreviousPage = async () => {
    if (!cursorHistory.length || loading) {
      return
    }

    const previousCursorRaw = cursorHistory[cursorHistory.length - 1]
    const previousCursor = previousCursorRaw === ROOT_CURSOR ? null : previousCursorRaw

    setCursorHistory((prev) => prev.slice(0, -1))
    setCurrentCursor(previousCursor)
    setPage((prev) => Math.max(1, prev - 1))
    await loadUsersPage(previousCursor)
  }

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
      await toggleAdminUserDisabled(idToken, {
        uid: target.uid,
        disabled: !target.disabled,
      })
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
      await deleteAdminUser(idToken, { uid: target.uid })
      await loadUsersPage(currentCursor)
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
        const idToken = user ? await user.getIdToken() : null
        await upsertAdminUser(idToken, {
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
        const idToken = user ? await user.getIdToken() : null
        const created = (await upsertAdminUser(idToken, {
          name: form.name.trim(),
          email: form.email.trim(),
          role: form.role,
          team: form.team.trim() || null,
        })) as CreateAdminUserResponse | undefined

        if (created?.initialPassword) {
          setGeneratedPassword(created.initialPassword)
        }

        setCurrentCursor(null)
        setCursorHistory([])
        setPage(1)
        await loadUsersPage(null)
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
        title="Gerenciar usuários"
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
              <Button
                size="sm"
                variant="outline"
                onClick={handlePreviousPage}
                disabled={!hasPreviousPage || loading}
              >
                Anterior
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleNextPage}
                disabled={!hasNextPage || loading}
              >
                Próxima
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-3 text-xs text-muted-foreground">
              Página {page}
            </div>
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
                  return (
                    <AdminUserCard
                      key={item.uid}
                      item={item}
                      isSelected={isSelected}
                      onEdit={handleEditUser}
                      onFreeze={(target) => {
                        void handleFreeze(target)
                      }}
                      onDelete={(target) => {
                        void handleDelete(target)
                      }}
                    />
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
            {generatedPassword ? (
              <div className="md:col-span-2 rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
                <p className="font-medium text-foreground">
                  Senha inicial gerada
                </p>
                <p className="text-xs text-muted-foreground">
                  Compartilhe esta senha com o usuário. Ela será usada no primeiro
                  acesso.
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <code className="rounded bg-muted px-2 py-1 text-sm">
                    {generatedPassword}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      await navigator.clipboard.writeText(generatedPassword)
                    }}
                  >
                    Copiar senha
                  </Button>
                </div>
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
      </div>
    </div>
  )
}

