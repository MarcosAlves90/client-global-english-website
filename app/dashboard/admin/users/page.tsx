"use client"

import * as React from "react"
import { GraduationCap, UserCheck, Users2, UserPlus, AlertCircle, X, Bot } from "lucide-react"

import { DashboardPage } from "@/components/dashboard/dashboard-page"
import { DashboardNotice } from "@/components/dashboard/dashboard-feedback"
import { DashboardStatCard } from "@/components/dashboard/dashboard-stat-card"
import { SearchField } from "@/components/dashboard/search-field"
import { DashboardSectionHeader } from "@/components/dashboard/dashboard-section-header"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect } from "@/components/ui/native-select"
import { Switch } from "@/components/ui/switch"
import type { AdminUserStats, AdminUserSummary, UserRole } from "@/lib/firebase/types"
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
  role: UserRole
  team: string
  disabled?: boolean
  isRobot: boolean
}

export default function Page() {
  const { role, isFirebaseReady, user } = useAuth()
  const [users, setUsers] = React.useState<AdminUserSummary[]>([])
  const [stats, setStats] = React.useState<AdminUserStats | null>(null)
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
  const [roleFilter, setRoleFilter] = React.useState<"all" | UserRole>("all")
  const [statusFilter, setStatusFilter] = React.useState<"all" | "active" | "disabled">("all")

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
        setStats(data.stats)
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

  const filteredUsers = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return users.filter((item) => {
      const matchesSearch =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.email.toLowerCase().includes(query)
      const matchesRole = roleFilter === "all" || item.role === roleFilter
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "disabled" ? Boolean(item.disabled) : !item.disabled)
      return matchesSearch && matchesRole && matchesStatus
    })
  }, [roleFilter, searchQuery, statusFilter, users])

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
      setStats((prev) =>
        prev
          ? {
              ...prev,
              disabledUsersCount: Math.max(
                0,
                prev.disabledUsersCount + (target.disabled ? -1 : 1)
              ),
            }
          : prev
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
        if (selectedUser.role !== form.role) {
          await loadUsersPage(null)
        }
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
    <DashboardPage
      title="Gerenciar usuários"
      breadcrumbItems={breadcrumbItems}
      description="Gerencie usuários, permissões e status de acesso da plataforma."
      contentClassName="gap-8"
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
    >
        {/* Error States */}
        {!isFirebaseReady && (
          <DashboardNotice className="text-xs">
            Firebase não configurado. Conecte para visualizar usuários reais.
          </DashboardNotice>
        )}
        {error && (
          <DashboardNotice tone="danger" className="text-xs">{error}</DashboardNotice>
        )}

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <DashboardStatCard
            title="Usuários cadastrados"
            value={stats?.totalUsersCount ?? "-"}
            icon={Users2}
            description="Total na plataforma"
            loading={loading}
          />
          <DashboardStatCard
            title="Contas bloqueadas"
            value={stats?.disabledUsersCount ?? "-"}
            icon={X}
            description="Acesso desabilitado"
            loading={loading}
          />
          <DashboardStatCard
            title="Professores"
            value={stats?.teacherUsersCount ?? "-"}
            icon={GraduationCap}
            description="Contas docentes"
            loading={loading}
          />
          <DashboardStatCard
            title="Administradores"
            value={stats?.adminUsersCount ?? "-"}
            icon={UserPlus}
            description="Gestores do sistema"
            loading={loading}
          />
        </div>

        {/* List Section */}
        <div className="space-y-4">
          <DashboardSectionHeader
            title="Base de usuários"
            description="Acompanhe usuários e status de acesso dos integrantes da plataforma."
            icon={Users2}
            action={
              <div className="grid w-full gap-2 sm:grid-cols-[minmax(220px,1fr)_160px_160px] lg:w-auto">
                <SearchField
                  value={searchQuery}
                  onChange={setSearchQuery}
                  ariaLabel="Buscar usuários"
                  placeholder="Buscar por nome ou email..."
                />
                <NativeSelect
                  aria-label="Filtrar usuários por perfil"
                  value={roleFilter}
                  onChange={(event) => setRoleFilter(event.target.value as "all" | UserRole)}
                >
                  <option value="all">Todos os perfis</option>
                  <option value="user">Alunos</option>
                  <option value="teacher">Professores</option>
                  <option value="admin">Administradores</option>
                </NativeSelect>
                <NativeSelect
                  aria-label="Filtrar usuários por status"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as "all" | "active" | "disabled")}
                >
                  <option value="all">Todos os status</option>
                  <option value="active">Ativos</option>
                  <option value="disabled">Bloqueados</option>
                </NativeSelect>
              </div>
            }
          />

          <div className="ge-surface-muted p-1">
            {loading ? (
              <div className="flex h-40 items-center justify-center text-sm text-muted-foreground animate-pulse">
                Sincronizando base de dados...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="m-2 flex h-40 items-center justify-center rounded-2xl border border-dashed border-border/70 text-sm text-muted-foreground">
                {searchQuery || roleFilter !== "all" || statusFilter !== "all" ? "Nenhum usuário corresponde aos filtros." : "Nenhum usuário cadastrado."}
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
          <div className="space-y-4">
            <DashboardSectionHeader
              title={selectedUser ? "Perfil do Usuário" : "Convite e Cadastro"}
              description={selectedUser ? "Ajuste permissões, atualize dados cadastrais ou congele o acesso." : "Cadastre novos integrantes na plataforma Global English."}
              icon={selectedUser ? UserCheck : UserPlus}
            />

            <Card className="overflow-hidden">
              <CardHeader className="border-b border-border/60">
                <CardTitle className="text-sm font-semibold">Informações principais</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2 pt-6">
                <div className="space-y-2">
                  <Label required htmlFor="user-name">Nome completo</Label>
                  <Input
                    id="user-name"
                    placeholder="Nome do usuário"
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
                                        value={form.email}
                    onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="user-role">Perfil</Label>
                  <NativeSelect
                    id="user-role"
                    value={form.role}
                    onChange={(e) => setForm((prev) => ({
                      ...prev,
                      role:
                        e.target.value === "admin"
                          ? "admin"
                          : e.target.value === "teacher"
                            ? "teacher"
                            : "user",
                    }))
                    }
                  >
                    <option value="user">Aluno</option>
                    <option value="teacher">Professor</option>
                    <option value="admin">Admin</option>
                  </NativeSelect>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="user-team">Equipe</Label>
                  <Input
                    id="user-team"
                    placeholder="Turma ou time"
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

                <div className="ge-surface-muted md:col-span-2 flex items-center justify-between gap-4 rounded-2xl p-4">
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
                  <div className="md:col-span-2 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
                    <p className="font-bold text-primary flex items-center gap-2">
                      <UserPlus className="size-4" />
                      Acesso criado com sucesso!
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Compartilhe a senha inicial gerada com o usuário para o primeiro acesso.
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <code className="rounded-md bg-muted px-3 py-1.5 text-sm font-semibold">
                        {generatedPassword}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
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

                  >
                    {saving ? "Sincronizando..." : selectedUser ? "Salvar alterações" : "Criar usuário"}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleCancelEdit}
                                      >
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
    </DashboardPage>
  )
}
