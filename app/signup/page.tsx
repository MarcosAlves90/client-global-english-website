"use client"

import { AuthLayout } from "@/components/auth/auth-layout"
import { SignupForm } from "@/components/auth/signup-form"
import { useRedirectIfAuthenticated } from "@/hooks/use-redirect-if-authenticated"
import { buildCloudinaryUrl } from "@/lib/cloudinary-url"

const isSignupDisabled = process.env.NEXT_PUBLIC_SIGNUP_ENABLED === "false"
const isSignupUnderConstruction = true
const SIGNUP_HERO_PUBLIC_ID = process.env.NEXT_PUBLIC_SIGNUP_HERO_PUBLIC_ID?.trim()
if (!SIGNUP_HERO_PUBLIC_ID) throw new Error("Missing env: NEXT_PUBLIC_SIGNUP_HERO_PUBLIC_ID")
const SIGNUP_HERO_IMAGE = buildCloudinaryUrl(SIGNUP_HERO_PUBLIC_ID)

export default function SignupPage() {
  const { isChecking } = useRedirectIfAuthenticated()
  if (isChecking) return null

  return (
    <AuthLayout
      reverseLayout
      imageSrc={SIGNUP_HERO_IMAGE}
      imageAlt="Ghent, Bélgica"
      badgeText="Acesso por convite"
      title="Seu acesso começa com a coordenação."
      description="A Global English mantém o cadastro público fechado para que cada conta seja criada com o perfil e os cursos corretos."
      bottomContent="O cadastro continua indisponível ao público. Esta mudança é apenas de interface e experiência."
    >
      <SignupForm isDisabled={isSignupDisabled || isSignupUnderConstruction} />
    </AuthLayout>
  )
}
