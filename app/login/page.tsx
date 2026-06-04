"use client"

import Image from "next/image"
import { Quote } from "lucide-react"
import { AuthLayout } from "@/components/layouts/auth-layout"
import { LoginForm } from "@/components/login-form"
import { useRedirectIfAuthenticated } from "@/hooks/use-redirect-if-authenticated"
import { buildCloudinaryUrl, optimizeCloudinaryUrl } from "@/lib/cloudinary-url"

const LOGIN_HERO_IMAGE = buildCloudinaryUrl("v1772349852/toronto-canada_glefp0.jpg")
const LOGIN_AVATAR_IMAGE = buildCloudinaryUrl("v1772409364/av3_wuknvs.jpg")

export default function LoginPage() {
  const { isChecking } = useRedirectIfAuthenticated()

  if (isChecking) return null

  return (
    <AuthLayout
      imageSrc={LOGIN_HERO_IMAGE}
      imageAlt="Toronto, Canada"
      badgeText="Área Exclusiva"
      title={
        <>
          Sua jornada para a <span className="text-primary">fluência</span> continua aqui.
        </>
      }
      description="Acompanhe seu progresso, acesse materiais exclusivos e conecte-se com sua turma em um ambiente focado no seu aprendizado."
      bottomContent={
        <div className="relative z-10 mt-auto pt-24">
          <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 backdrop-blur-md">
            <Quote className="size-8 text-primary/60 mb-4" />
            <p className="text-zinc-300 italic mb-4">
              &quot;A organização da plataforma mudou minha forma de estudar inglês. Tudo que eu preciso está centralizado e as trilhas são extremamente claras.&quot;
            </p>
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-zinc-800 overflow-hidden border border-zinc-700">
                <Image
                  src={optimizeCloudinaryUrl(LOGIN_AVATAR_IMAGE, {
                    width: 80,
                    height: 80,
                    crop: "fill",
                    gravity: "auto",
                  })}
                  alt="Avatar"
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <div className="text-sm font-medium text-zinc-100">Vivian Yamamoto</div>
                <div className="text-xs text-zinc-500">Aluno Advanced</div>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <LoginForm />
    </AuthLayout>
  )
}
