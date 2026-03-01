"use client"

import * as React from "react"
import { Bell, Eye, EyeOff, ShieldCheck, User, Camera, Mail, LogOut } from "lucide-react"

import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSectionHeader } from "@/components/dashboard-section-header"
import { useAuth } from "@/hooks/use-auth"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { uploadImage, deleteImage, getPublicIdFromUrl } from "@/lib/cloudinary-actions"
import { updateUserProfile } from "@/lib/firebase/firestore"
import { updateProfile } from "firebase/auth"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

export default function Page() {
  const { user, profile, isFirebaseReady, signOut, refreshProfile } = useAuth()
  const [showPassword, setShowPassword] = React.useState(false)
  const [showConfirm, setShowConfirm] = React.useState(false)
  const [isUploading, setIsUploading] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user) return

    try {
      setIsUploading(true)
      const formData = new FormData()
      formData.append("file", file)

      const result = await uploadImage(formData, "avatars")

      // Delete previous image from Cloudinary if it exists
      const oldPhotoURL = profile?.photoURL || user.photoURL
      if (oldPhotoURL) {
        const publicId = await getPublicIdFromUrl(oldPhotoURL)
        if (publicId) {
          await deleteImage(publicId)
        }
      }

      // Update Firebase Auth
      await updateProfile(user, {
        photoURL: result.secure_url
      })

      // Update Firestore
      await updateUserProfile(user.uid, {
        photoURL: result.secure_url
      })

      await refreshProfile()
      toast.success("Foto atualizada com sucesso!")
    } catch (error) {
      console.error("Upload failed:", error)
      toast.error("Falha ao atualizar foto.")
    } finally {
      setIsUploading(false)
    }
  }

  const displayName = React.useMemo(
    () => profile?.name ?? user?.displayName ?? "Usuário",
    [profile?.name, user?.displayName]
  )
  const email = React.useMemo(() => user?.email ?? "", [user?.email])

  return (
    <div className="flex-1">
      <DashboardHeader
        title="Configurações"
        description="Ajuste suas preferências e mantenha seu perfil atualizado."
      />

      <div className="flex flex-col gap-8 p-6 pb-16">
        {!isFirebaseReady && (
          <div className="rounded-xl border border-dashed bg-accent/40 p-4 text-xs text-muted-foreground">
            Firebase não configurado. Alterações serão apenas locais.
          </div>
        )}

        {/* Profile Card */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-linear-to-r from-primary/20 to-primary/5 rounded-3xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
          <Card className="relative bg-card/40 border-dashed backdrop-blur-xl border-primary/10 overflow-hidden">
            <CardContent className="flex flex-col items-center gap-6 px-8 py-2 sm:flex-row sm:justify-between">
              <div className="flex flex-col items-center gap-6 sm:flex-row">
                <div className="relative group/avatar">
                  <Avatar className="size-20 border-background shadow-2xl ring-1 ring-primary/20 transition-transform duration-500 group-hover/avatar:scale-105">
                    <AvatarImage src={user?.photoURL ?? ""} alt={displayName} />
                    <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                      {displayName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <button className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full shadow-lg hover:scale-110 transition-all opacity-0 group-hover/avatar:opacity-100">
                    <Camera className="size-4" />
                  </button>
                </div>
                <div className="text-center sm:text-left space-y-1">
                  <h2 className="text-2xl font-bold tracking-tight">{displayName}</h2>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center sm:justify-start">
                    <Mail className="size-3.5" />
                    {email}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 justify-center">
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                />
                <Button
                  variant="outline"
                  className="rounded-full px-6 border-primary/10 hover:bg-primary/5 transition-all"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                  {isUploading ? "Enviando..." : "Alterar Foto"}
                </Button>
                <Button
                  variant="ghost"
                  className="rounded-full px-6 text-destructive hover:bg-destructive/10 hover:text-destructive transition-all"
                  onClick={() => signOut()}
                >
                  <LogOut className="size-4 mr-2" />
                  Sair
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sections Grid */}
        <div className="grid gap-8">
          {/* Main Info */}
          <div className="space-y-4">
            <DashboardSectionHeader
              title="Dados pessoais"
              description="Informações básicas de identificação na plataforma."
              icon={User}
            />
            <Card className="bg-card/40 backdrop-blur-sm border-primary/5">
              <CardContent className="grid gap-6 md:grid-cols-2 p-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nome completo</Label>
                  <Input
                    id="name"
                    placeholder="Seu nome"
                    defaultValue={profile?.name ?? user?.displayName ?? ""}
                    className="bg-background/50 border-primary/10 focus:border-primary/30 h-11"
                    disabled
                  />
                  <p className="text-[10px] text-muted-foreground italic">Nome bloqueado para edição pelo sistema.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Endereço de Email</Label>
                  <Input
                    id="email"
                    placeholder="seu@email.com"
                    defaultValue={user?.email ?? ""}
                    className="bg-background/50 border-primary/10 focus:border-primary/30 h-11"
                    disabled
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Security */}
            <div className="flex flex-col gap-4 h-full">
              <DashboardSectionHeader
                title="Segurança"
                description="Proteja sua conta alterando sua senha."
                icon={ShieldCheck}
              />
              <Card className="bg-card/40 backdrop-blur-sm border-primary/5">
                <CardContent className="grid gap-6 p-6">
                  <div className="space-y-2">
                    <Label htmlFor="password">Nova senha</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="bg-background/50 border-primary/10 pr-10 h-11"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm">Confirmar nova senha</Label>
                    <div className="relative">
                      <Input
                        id="confirm"
                        type={showConfirm ? "text" : "password"}
                        placeholder="••••••••"
                        className="bg-background/50 border-primary/10 pr-10 h-11"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
                        onClick={() => setShowConfirm((prev) => !prev)}
                        aria-label={showConfirm ? "Ocultar senha" : "Mostrar senha"}
                      >
                        {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>
                  <Button className="w-full rounded-full shadow-lg shadow-primary/10 transition-all hover:scale-[1.02] active:scale-[0.98]">
                    Atualizar senha de acesso
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Notifications */}
            <div className="flex flex-col gap-4 h-full">
              <DashboardSectionHeader
                title="Comunicação"
                description="Escolha como deseja receber atualizações."
                icon={Bell}
              />
              <Card className="bg-card/40 backdrop-blur-sm border-primary/5">
                <CardContent className="space-y-4 p-6">
                  <div className="flex items-center justify-between gap-4 rounded-xl border border-primary/5 bg-background/20 p-4 transition-all hover:bg-background/30 group">
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <p className="text-sm font-medium">Alertas de atividades</p>
                      <p className="text-[11px] text-muted-foreground leading-tight wrap-break-word">
                        Avisos sobre novas tarefas enviadas pelos instrutores.
                      </p>
                    </div>
                    <Switch defaultChecked className="data-[state=checked]:bg-primary shrink-0" />
                  </div>
                  <div className="flex items-center justify-between gap-4 rounded-xl border border-primary/5 bg-background/20 p-4 transition-all hover:bg-background/30 group">
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <p className="text-sm font-medium">Relatório semanal</p>
                      <p className="text-[11px] text-muted-foreground leading-tight wrap-break-word">
                        Resumo detalhado do seu desempenho e materiais.
                      </p>
                    </div>
                    <Switch className="data-[state=checked]:bg-primary shrink-0" />
                  </div>
                  <div className="flex items-center justify-between gap-4 rounded-xl border border-primary/5 bg-background/20 p-4 transition-all hover:bg-background/30 group">
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <p className="text-sm font-medium">Mkt & Novidades</p>
                      <p className="text-[11px] text-muted-foreground leading-tight wrap-break-word">
                        Novos lançamentos de cursos e promoções exclusivas.
                      </p>
                    </div>
                    <Switch className="data-[state=checked]:bg-primary shrink-0" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
