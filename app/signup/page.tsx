"use client"

import Link from "next/link"
import { AlertCircle, Construction } from "lucide-react"
import { AuthLayout } from "@/components/layouts/auth-layout"
import { SignupForm } from "@/components/signup-form"
import { useRedirectIfAuthenticated } from "@/hooks/use-redirect-if-authenticated"
import { buildCloudinaryUrl } from "@/lib/cloudinary-url"

const isSignupDisabled = process.env.NEXT_PUBLIC_SIGNUP_ENABLED === "false"
const isSignupUnderConstruction = true
const SIGNUP_HERO_IMAGE = buildCloudinaryUrl("v1772349852/ghent-belgica_nkpima.jpg")

export default function SignupPage() {
  const { isChecking } = useRedirectIfAuthenticated()

  if (isChecking) return null

  return (
    <AuthLayout
      reverseLayout
      primaryColorTheme
      imageSrc={SIGNUP_HERO_IMAGE}
      imageAlt="Ghent, Belgica"
      badgeText={
        <>
          <Construction className="size-4" />
          Cadastro em construção
        </>
      }
      title="Cadastro temporariamente indisponível."
      description="Estamos finalizando melhorias no fluxo de criação de conta para garantir uma experiência mais confiável e segura."
      bottomContent={
        <div className="relative z-10 mt-auto pt-24 text-right">
          <p className="mb-2 text-sm font-medium text-white/80">Ja possui acesso?</p>
          <Link
            href="/login"
            className="inline-flex h-12 items-center justify-center rounded-full border border-white/20 bg-white/10 px-6 font-semibold text-white backdrop-blur-sm transition-all hover:scale-105 hover:bg-white/20 active:scale-95"
          >
            Acessar Minha Conta
          </Link>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-300">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 size-5 shrink-0" />
            <div className="space-y-1">
              <p className="font-semibold">Cadastro em construção</p>
              <p className="text-amber-700/90 dark:text-amber-200/90">
                O fluxo de signup ainda não está liberado. Use uma conta existente para entrar no portal.
              </p>
            </div>
          </div>
        </div>

        <SignupForm isDisabled={isSignupDisabled || isSignupUnderConstruction} />
      </div>
    </AuthLayout>
  )
}
