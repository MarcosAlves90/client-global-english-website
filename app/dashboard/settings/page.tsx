"use client"

import * as React from "react"
import {
  Bell,
  Camera,
  Eye,
  EyeOff,
  Loader2,
  LogOut,
  Mail,
  ShieldCheck,
} from "lucide-react"
import { updateProfile } from "firebase/auth"
import { toast } from "sonner"

import { DashboardNotice } from "@/components/dashboard/dashboard-feedback"
import { DashboardPage } from "@/components/dashboard/dashboard-page"
import { SegmentedControl } from "@/components/dashboard/segmented-control"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useAuth } from "@/hooks/use-auth"
import { validatePasswordChange } from "@/lib/auth/password-change"
import { updateCurrentUserPassword } from "@/lib/firebase/auth"
import { uploadImage, deleteImage, getPublicIdFromUrl } from "@/lib/cloudinary-actions"
import {
  updateUserNotificationPreferences,
  updateUserProfile,
} from "@/lib/firebase/firestore"
import type { NotificationPreferences } from "@/lib/firebase/types"

const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  activityUpdates: true,
  gradesAndFeedback: true,
  weeklySummary: false,
  marketing: false,
}

export default function Page() {
  const { user, profile, isFirebaseReady, signOut, refreshProfile } = useAuth()
  const [showPassword, setShowPassword] = React.useState(false)
  const [showConfirm, setShowConfirm] = React.useState(false)
  const [password, setPassword] = React.useState("")
  const [confirmation, setConfirmation] = React.useState("")
  const [isUpdatingPassword, setIsUpdatingPassword] = React.useState(false)
  const [isUploading, setIsUploading] = React.useState(false)
  const [isSavingPreferences, setIsSavingPreferences] = React.useState(false)
  const [preferences, setPreferences] = React.useState<NotificationPreferences>(
    DEFAULT_NOTIFICATION_PREFERENCES
  )
  const [section, setSection] = React.useState<"profile" | "security" | "notifications">("profile")
  const avatarInputId = React.useId()
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    setPreferences(
      profile?.notificationPreferences ?? DEFAULT_NOTIFICATION_PREFERENCES
    )
  }, [profile?.notificationPreferences])

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputElement = event.currentTarget
    const file = event.target.files?.[0]
    if (!file || !user) return

    try {
      setIsUploading(true)
      const formData = new FormData()
      formData.append("file", file)
      const result = await uploadImage(formData, "avatars")
      const oldPhotoURL = profile?.photoURL || user.photoURL
      if (oldPhotoURL) {
        const publicId = await getPublicIdFromUrl(oldPhotoURL)
        if (publicId) await deleteImage(publicId)
      }
      await updateProfile(user, { photoURL: result.secure_url })
      await updateUserProfile(user.uid, { photoURL: result.secure_url })
      await refreshProfile()
      toast.success("Foto atualizada com sucesso.")
    } catch (error) {
      console.error("Upload failed:", error)
      toast.error("Falha ao atualizar foto.")
    } finally {
      setIsUploading(false)
      inputElement.value = ""
    }
  }

  const handlePasswordChange = async () => {
    if (!user) return
    const validation = validatePasswordChange(password, confirmation)
    if (!validation.ok) {
      toast.error(validation.message)
      return
    }

    try {
      setIsUpdatingPassword(true)
      await updateCurrentUserPassword({ password })
      setPassword("")
      setConfirmation("")
      toast.success("Senha atualizada com sucesso.")
    } catch (error) {
      const code =
        error && typeof error === "object" && "code" in error
          ? String((error as { code?: string }).code)
          : ""
      toast.error(
        code.includes("requires-recent-login")
          ? "Entre novamente na conta antes de alterar a senha."
          : "Não foi possível atualizar a senha."
      )
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  const handleSavePreferences = async () => {
    if (!user) return
    try {
      setIsSavingPreferences(true)
      await updateUserNotificationPreferences(user.uid, preferences)
      await refreshProfile()
      toast.success("Preferências salvas.")
    } catch {
      toast.error("Não foi possível salvar as preferências.")
    } finally {
      setIsSavingPreferences(false)
    }
  }

  const displayName = profile?.name ?? user?.displayName ?? "Usuário"
  const email = user?.email ?? ""


  return (
    <DashboardPage
      title="Configurações"
      description="Perfil, segurança e comunicação em um único lugar."
      toolbar={
        <SegmentedControl
          value={section}
          onChange={setSection}
          ariaLabel="Seções das configurações"
          options={[
            { value: "profile", label: "Perfil" },
            { value: "security", label: "Segurança" },
            { value: "notifications", label: "Notificações" },
          ]}
        />
      }
    >
      {!isFirebaseReady ? (
        <DashboardNotice>Firebase não configurado. Alterações persistentes estão indisponíveis.</DashboardNotice>
      ) : null}

      {section === "profile" ? (
        <Card className="max-w-3xl py-0">
          <CardContent className="space-y-6 p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="size-20 ring-1 ring-border">
                    <AvatarImage src={user?.photoURL ?? ""} alt={displayName} />
                    <AvatarFallback className="bg-primary/10 text-xl font-semibold text-primary">{displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <label htmlFor={avatarInputId} className="absolute -bottom-1 -right-1 flex size-8 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm" aria-label="Selecionar nova foto de perfil">
                    <Camera className="size-4" />
                  </label>
                </div>
                <div><h2 className="text-xl font-semibold">{displayName}</h2><p className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground"><Mail className="size-3.5" />{email}</p></div>
              </div>
              <div className="flex gap-2"><input id={avatarInputId} type="file" ref={fileInputRef} className="sr-only" accept="image/*" onChange={handleAvatarUpload} /><Button asChild variant="outline" disabled={isUploading}><label htmlFor={avatarInputId} className="cursor-pointer">{isUploading ? <Loader2 className="size-4 animate-spin" /> : null}{isUploading ? "Enviando..." : "Alterar foto"}</label></Button><Button variant="ghost" className="text-destructive" onClick={() => signOut()}><LogOut className="size-4" />Sair</Button></div>
            </div>
            <div className="grid gap-4 border-t border-border pt-5 sm:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="name">Nome completo</Label><Input id="name" value={displayName} readOnly /></div>
              <div className="space-y-2"><Label htmlFor="email">Endereço de email</Label><Input id="email" value={email} readOnly /></div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {section === "security" ? (
        <Card className="max-w-2xl py-0"><CardContent className="space-y-5 p-6"><div><div className="ge-icon-tile mb-3 size-10"><ShieldCheck className="size-4.5" /></div><h2 className="font-semibold">Alterar senha</h2><p className="mt-1 text-sm text-muted-foreground">Use uma senha nova que atenda à política de segurança da plataforma.</p></div>
          <div className="space-y-2"><Label htmlFor="password">Nova senha</Label><div className="relative"><Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" className="pr-10" /><button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-muted" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}>{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button></div></div>
          <div className="space-y-2"><Label htmlFor="confirm">Confirmar nova senha</Label><div className="relative"><Input id="confirm" type={showConfirm ? "text" : "password"} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="new-password" className="pr-10" /><button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-muted" onClick={() => setShowConfirm((value) => !value)} aria-label={showConfirm ? "Ocultar senha" : "Mostrar senha"}>{showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button></div></div>
          <Button onClick={() => void handlePasswordChange()} disabled={isUpdatingPassword || !user}>{isUpdatingPassword ? "Atualizando..." : "Atualizar senha"}</Button>
        </CardContent></Card>
      ) : null}

      {section === "notifications" ? (
        <Card className="max-w-2xl py-0"><CardContent className="space-y-1 p-6"><div className="mb-4"><div className="ge-icon-tile mb-3 size-10"><Bell className="size-4.5" /></div><h2 className="font-semibold">Preferências de comunicação</h2><p className="mt-1 text-sm text-muted-foreground">Escolha os tipos de aviso que deseja receber quando a central de notificações estiver ativa.</p></div>
          {([
            ["activityUpdates", "Atividades", "Novas tarefas e alterações de prazo."],
            ["gradesAndFeedback", "Notas e feedback", "Avisos quando uma atividade for avaliada."],
            ["weeklySummary", "Resumo semanal", "Resumo periódico do seu progresso."],
            ["marketing", "Novidades", "Comunicados sobre cursos e novos recursos."],
          ] as const).map(([key, title, description]) => <div key={key} className="flex items-center justify-between gap-4 border-t border-border py-4 first:border-t-0"><div><p className="text-sm font-medium">{title}</p><p className="mt-0.5 text-xs text-muted-foreground">{description}</p></div><Switch checked={preferences[key]} onCheckedChange={(checked) => setPreferences((current) => ({ ...current, [key]: checked }))} aria-label={title} /></div>)}
          <Button className="mt-3" onClick={() => void handleSavePreferences()} disabled={isSavingPreferences || !user}>{isSavingPreferences ? "Salvando..." : "Salvar preferências"}</Button>
        </CardContent></Card>
      ) : null}
    </DashboardPage>
  )
}
