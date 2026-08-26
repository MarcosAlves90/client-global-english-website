import React from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, BookOpen, ClipboardCheck, GraduationCap } from "lucide-react"

import { Logo } from "@/components/ui/logo"
import { optimizeCloudinaryUrl } from "@/lib/cloudinary-url"
import { cn } from "@/lib/utils"

interface AuthLayoutProps {
  children: React.ReactNode
  imageSrc: string
  imageAlt: string
  badgeText?: React.ReactNode
  title: React.ReactNode
  description?: string
  bottomContent?: React.ReactNode
  reverseLayout?: boolean
}

const PRODUCT_AREAS = [
  { label: "Cursos", icon: GraduationCap },
  { label: "Atividades", icon: ClipboardCheck },
  { label: "Materiais", icon: BookOpen },
] as const

export function AuthLayout({
  children,
  imageSrc,
  imageAlt,
  badgeText,
  title,
  description,
  bottomContent,
  reverseLayout = false,
}: AuthLayoutProps) {
  const optimized = optimizeCloudinaryUrl(imageSrc, {
    width: 1280,
    height: 1600,
    crop: "fill",
    gravity: "auto",
    quality: 72,
  })

  return (
    <div className="relative min-h-svh overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -left-32 -top-32 size-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 right-0 size-[30rem] rounded-full bg-primary/5 blur-3xl" />
      </div>

      <header className="absolute inset-x-0 top-0 z-20">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
          <Link href="/" className="inline-flex items-center gap-2.5 rounded-full py-1 pr-3 text-sm font-semibold text-foreground transition-colors hover:text-primary">
            <span className="ge-icon-tile size-9 bg-primary text-primary-foreground">
              <Logo className="size-5" />
            </span>
            <span>Global English</span>
          </Link>
          <Link href="/" className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            <ArrowLeft className="size-3.5" />
            <span className="hidden sm:inline">Voltar ao site</span>
          </Link>
        </div>
      </header>

      <main className="relative mx-auto grid min-h-svh max-w-7xl items-center gap-6 px-5 pb-6 pt-24 sm:px-8 sm:pb-8 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-8 lg:px-10 lg:pb-10 lg:pt-24">
        <section className={cn("flex justify-center lg:justify-start", reverseLayout && "lg:order-2 lg:justify-end")}>
          <div className="ge-surface w-full max-w-xl bg-card/95 p-6 shadow-lg shadow-black/5 sm:p-8 lg:p-10 dark:bg-card/95">
            <div className="mb-7">
              {badgeText ? <div className="ge-chip mb-4 w-fit bg-primary/10 text-primary">{badgeText}</div> : null}
              <h1 className="max-w-lg text-3xl font-semibold leading-tight tracking-[-0.045em] text-foreground sm:text-4xl">
                {title}
              </h1>
              {description ? (
                <p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
                  {description}
                </p>
              ) : null}
            </div>
            {children}
          </div>
        </section>

        <section data-auth-visual className={cn("relative hidden min-h-[680px] overflow-hidden rounded-[2rem] border border-border bg-muted shadow-sm lg:block", reverseLayout && "lg:order-1")}>
          <Image
            src={optimized}
            alt={imageAlt}
            fill
            sizes="(min-width: 1024px) 52vw, 100vw"
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-linear-to-b from-black/10 via-black/10 to-black/70" />

          <div className="absolute left-6 top-6 flex items-center gap-2 rounded-full border border-white/15 bg-black/20 px-3 py-1.5 text-xs font-medium text-white/90 backdrop-blur-md">
            <span className="size-1.5 rounded-full bg-white" />
            Portal de aprendizagem
          </div>

          <div className="absolute inset-x-6 bottom-6 rounded-[1.75rem] border border-white/15 bg-black/30 p-6 text-white shadow-xl backdrop-blur-xl xl:inset-x-8 xl:bottom-8 xl:p-7">
            <p className="text-xl font-semibold tracking-[-0.025em]">Seu aprendizado, sem ruído.</p>
            <p className="mt-2 max-w-xl text-sm leading-6 text-white/70">
              Acesse o que precisa com a mesma organização encontrada no restante da plataforma.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {PRODUCT_AREAS.map(({ label, icon: Icon }) => (
                <span key={label} className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/90">
                  <Icon className="size-3.5" />
                  {label}
                </span>
              ))}
            </div>
            {bottomContent ? <div className="mt-5 border-t border-white/15 pt-5 text-sm text-white/70">{bottomContent}</div> : null}
          </div>
        </section>
      </main>
    </div>
  )
}
