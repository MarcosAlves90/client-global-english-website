"use client"

import * as React from "react"
import { Mail, UserCheck, Users2, UserPlus, Search, AlertCircle, X, Bot } from "lucide-react"

import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardStatCard } from "@/components/dashboard-stat-card"
import { DashboardSectionHeader } from "@/components/dashboard-section-header"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
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


type EditableUser = {
  uid: string
  name: string
  email: string
  role: "admin" | "user"
  team: string
  disabled?: boolean
  isRobot: boolean
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
    isRobot: false,
  })
  const [saving, setSaving] = React.useState(false)
  const [formError, setFormError] = React.useState<string | null>(null)
  const [generatedPassword, setGeneratedPassword] = React.useState<string | null>(
    null
  )
  const [searchQuery, setSearchQuery] = React.useState("")

  const [showForm, setShowForm] = React.useState(false)
  const breadcrumbItems = React.useMemo(() => [{ label: "Admin", href: "/dashboard/admin" }, { label: "Usuários" }], [])

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
        isRobot: false,
      })
      setFormError(null)
      setGeneratedPassword(null)
    }
  }, [selectedUser])

  const totalUsers = users.length
  const adminUsers = users.filter((u) => u.role === "admin").length

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
        <Card className="border-destructive/20 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-destructive">
              <AlertCircle className="size-5" />
              Acesso restrito
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Esta área é exclusiva para administradores da plataforma.
          </CardContent>
        </Card>
      </div>
    )
  }


  const teamOptions = Array.from(
    new Set(
      users
        .map((u) => u.team)
        .filter((team): team is string => Boolean(team && team.trim()))
        .map((team) => team.trim())
    )
  ).sort((a, b) => a.localeCompare(b))

  const handleEditUser = (u: AdminUserSummary) => {
    setSelectedUser({
      uid: u.uid,
      name: u.name,
      email: u.email,
      role: u.role,
      team: u.team ?? "",
      disabled: u.disabled,
      isRobot: Boolean(u.isRobot),
    })
    setShowForm(true)
  }

  const handleCancelEdit = () => {
    setSelectedUser(null)
    setShowForm(false)
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
      await loadUsersPage(null)
    } catch {
      setError("Não foi possível excluir o usuário.")
    }
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      setFormError("Nome e email são obrigatórios.")
      return
    }

    setSaving(true)
    setFormError(null)

    try {
      const idToken = user ? await user.getIdToken() : null
      if (selectedUser) {
        await upsertAdminUser(idToken, {
          uid: selectedUser.uid,
          name: form.name.trim(),
          email: form.email.trim(),
          role: form.role,
          team: form.team.trim() || null,
          isRobot: form.isRobot,
        })

        setUsers((prev) =>
          prev.map((u) =>
            u.uid === selectedUser.uid
              ? {
                ...u,
                name: form.name.trim(),
                email: form.email.trim(),
                role: form.role,
                team: form.team.trim() || null,
                isRobot: form.isRobot,
              }
              : u
          )
        )
        setSelectedUser(null)
        setShowForm(false)
      } else {
        const created = (await upsertAdminUser(idToken, {
          name: form.name.trim(),
          email: form.email.trim(),
          role: form.role,
          team: form.team.trim() || null,
          isRobot: form.isRobot,
        })) as CreateAdminUserResponse | undefined

        if (created?.initialPassword) {
          setGeneratedPassword(created.initialPassword)
        } else {
          setShowForm(false)
        }

        await loadUsersPage(null)
        setForm({
          uid: "",
          name: "",
          email: "",
          role: "user",
          team: "",
          disabled: false,
          isRobot: false,
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
    <div className="flex-1">
      <DashboardHeader
        title="Gerenciar usuários"
        breadcrumbItems={breadcrumbItems}
        description="Gerencie alunos, instrutores e permissões da plataforma."
        action={
          <Button
            size="sm"
            onClick={() => {
              if (showForm && !selectedUser) {
                setShowForm(false)
              } else {
                setSelectedUser(null)
                setShowForm(true)
              }
            }}
            className="shadow-lg shadow-primary/10"
          >
            {showForm && !selectedUser ? (
              <>
                <X className="mr-2 size-4" />
                Fechar
              </>
            ) : (
              <>
                <UserPlus className="mr-2 size-4" />
                Convidar usuário
              </>
            )}
          </Button>
        }
      />

      <div className="flex flex-col gap-8 p-6">
        {/* Error States */}
        {!isFirebaseReady && (
          <div className="rounded-xl border border-dashed bg-accent/40 p-4 text-xs text-muted-foreground">
            Firebase não configurado. Conecte para visualizar usuários reais.
          </div>
        )}
        {error && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-xs text-destructive">
            {error}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-3">
          <DashboardStatCard
            title="Usuários ativos"
            value={totalUsers}
            icon={Users2}
            description="Total na plataforma"
            loading={loading}
          />
          <DashboardStatCard
            title="Convites pendentes"
            value="-"
            icon={Mail}
            description="Aguardando ativação"
            loading={loading}
          />
          <DashboardStatCard
            title="Administradores"
            value={adminUsers}
            icon={UserPlus}
            description="Gestores do sistema"
            loading={loading}
          />
        </div>

        {/* List Section */}
        <div className="space-y-4">
          <DashboardSectionHeader
            title="Base de usuários"
            description="Acompanhe convites e status de acesso dos integrantes da plataforma."
            icon={Users2}
            action={
              <div className="flex items-center gap-2 max-lg:w-full">
                <div className="relative max-lg:w-full">
                  <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar usuários..."
                    className="h-9 w-full pl-9 lg:w-75 bg-card/40 backdrop-blur-sm border-primary/20 transition-all focus:border-primary/30"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full border-primary/20 hover:border-primary/30"
                  onClick={() => setSearchQuery("")}
                >
                  Limpar
                </Button>

              </div>
            }
          />

          <div className="rounded-xl bg-card/30 backdrop-blur-sm border border-primary/5 p-1 transition-all">
            {loading ? (
              <div className="flex h-40 items-center justify-center text-sm text-muted-foreground animate-pulse">
                Sincronizando base de dados...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex h-40 items-center justify-center text-sm text-muted-foreground border border-dashed border-primary/20 rounded-lg m-2">
                {searchQuery ? "Nenhum resultado para esta busca." : "Nenhum usuário cadastrado."}
              </div>
            ) : (
              <div className="grid gap-4 p-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredUsers.map((u) => (
                  <AdminUserCard
                    key={u.uid}
                    item={u}
                    isSelected={selectedUser?.uid === u.uid}
                    onEdit={handleEditUser}
                    onFreeze={(target) => void handleFreeze(target)}
                    onDelete={(target) => void handleDelete(target)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Form Section */}
        {showForm && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <DashboardSectionHeader
              title={selectedUser ? "Perfil do Usuário" : "Convite e Cadastro"}
              description={selectedUser ? "Ajuste permissões, atualize dados cadastrais ou congele o acesso." : "Cadastre novos integrantes na plataforma Global English."}
              icon={selectedUser ? UserCheck : UserPlus}
            />

            <Card className="border-primary/20 bg-card/40 backdrop-blur-sm overflow-hidden border-dashed">
              <CardHeader className="border-b border-primary/5 bg-primary/1">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <div className="size-2 rounded-full bg-primary animate-pulse" />
                  Informações Principais
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2 pt-6">
                <div className="space-y-2">
                  <Label required htmlFor="user-name">Nome completo</Label>
                  <Input
                    id="user-name"
                    placeholder="Nome do usuário"
                    className="bg-background/50"
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label required htmlFor="user-email">Email</Label>
                  <Input
                    id="user-email"
                    type="email"
                    placeholder="usuario@empresa.com"
                    className="bg-background/50"
                    value={form.email}
                    onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="user-role">Perfil</Label>
                  <select
                    id="user-role"
                    className={cn(selectClassName, "bg-background/50")}
                    value={form.role}
                    onChange={(e) => setForm((prev) => ({
                      ...prev,
                      role: e.target.value === "admin" ? "admin" : "user",
                    }))
                    }
                  >
                    <option value="user">Aluno</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="user-team">Equipe</Label>
                  <Input
                    id="user-team"
                    placeholder="Turma ou time"
                    className="bg-background/50"
                    value={form.team}
                    onChange={(e) => setForm((prev) => ({ ...prev, team: e.target.value }))}
                    list="team-options"
                  />
                  <datalist id="team-options">
                    {teamOptions.map((opt) => (
                      <option key={opt} value={opt} />
                    ))}
                  </datalist>
                </div>

                <div className="md:col-span-2 flex items-center justify-between gap-4 rounded-lg border border-primary/10 bg-background/40 p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">Conta de testes (robô)</p>
                    <p className="text-xs text-muted-foreground">
                      Marque para identificar usuários automatizados ou usados apenas em QA.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Bot className="size-4 text-muted-foreground" />
                    <Switch
                      checked={form.isRobot}
                      onCheckedChange={(checked) =>
                        setForm((prev) => ({ ...prev, isRobot: checked }))
                      }
                      aria-label="Marcar usuário como conta de testes"
                    />
                  </div>
                </div>

                {formError && (
                  <div className="md:col-span-2 text-sm text-destructive flex items-center gap-2">
                    <AlertCircle className="size-4" />
                    {formError}
                  </div>
                )}

                {generatedPassword && (
                  <div className="md:col-span-2 rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm animate-in fade-in slide-in-from-top-2">
                    <p className="font-bold text-primary flex items-center gap-2">
                      <UserPlus className="size-4" />
                      Acesso criado com sucesso!
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Compartilhe a senha inicial gerada com o usuário para o primeiro acesso.
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <code className="rounded-md bg-muted px-3 py-1.5 text-sm font-bold tracking-wider">
                        {generatedPassword}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full"
                        onClick={() => navigator.clipboard.writeText(generatedPassword)}
                      >
                        Copiar
                      </Button>
                    </div>
                  </div>
                )}

                <div className="md:col-span-2 flex items-center gap-3 pt-6 border-t border-primary/5 mt-2">
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="rounded-full px-10 shadow-lg shadow-primary/20 transition-all active:scale-95"
                  >
                    {saving ? "Sincronizando..." : selectedUser ? "Salvar alterações" : "Criar usuário"}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleCancelEdit}
                    className="rounded-full px-6"
                  >
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
