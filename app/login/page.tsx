"use client"

import { AuthLayout } from "@/components/auth/auth-layout"
import { LoginForm } from "@/components/auth/login-form"
import { useRedirectIfAuthenticated } from "@/hooks/use-redirect-if-authenticated"
import { buildCloudinaryUrl } from "@/lib/cloudinary-url"

const LOGIN_HERO_PUBLIC_ID = process.env.NEXT_PUBLIC_LOGIN_HERO_PUBLIC_ID?.trim()
if (!LOGIN_HERO_PUBLIC_ID) throw new Error("Missing env: NEXT_PUBLIC_LOGIN_HERO_PUBLIC_ID")
const LOGIN_HERO_IMAGE = buildCloudinaryUrl(LOGIN_HERO_PUBLIC_ID)

export default function LoginPage() {
  const { isChecking } = useRedirectIfAuthenticated()
  if (isChecking) return null

  return (
    <AuthLayout
      imageSrc={LOGIN_HERO_IMAGE}
      imageAlt="Toronto, Canada"
      badgeText="Acesso à plataforma"
      title="Bem-vindo de volta."
      description="Entre para continuar seus cursos, acompanhar atividades e acessar seus materiais."
    >
      <LoginForm />
    </AuthLayout>
  )
}
