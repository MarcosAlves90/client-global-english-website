import React from "react"
import Link from "next/link"
import Image from "next/image"
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
    reverseLayout?: boolean // To support signup's reversed layout
    primaryColorTheme?: boolean // To support signup's primary color theme vs zinc-950
}

export function AuthLayout({
    children,
    imageSrc,
    imageAlt,
    badgeText,
    title,
    description,
    bottomContent,
    reverseLayout = false,
    primaryColorTheme = false,
}: AuthLayoutProps) {
    const optimizedImageSrc = optimizeCloudinaryUrl(imageSrc, {
        width: 1280,
        height: 1600,
        crop: "fill",
        gravity: "auto",
        quality: 60,
    })

    return (
        <div className={cn("relative isolate min-h-svh overflow-hidden bg-[#08090d] text-white", reverseLayout ? "lg:flex-row-reverse" : "lg:flex-row", "flex flex-col lg:flex-row")}>
            <div className="pointer-events-none absolute -left-32 top-1/3 size-96 rounded-full bg-primary/10 blur-[120px] lg:hidden" aria-hidden="true" />
            <div className="pointer-events-none absolute -right-32 bottom-0 size-96 rounded-full bg-accent/10 blur-[120px] lg:hidden" aria-hidden="true" />
            {/* Informational Pane */}
            <div className="relative hidden min-h-svh w-[48%] flex-col justify-between overflow-hidden border-r border-white/10 bg-zinc-950 p-8 text-zinc-50 lg:flex xl:p-12">
                {/* Abstract Background for Premium Feel */}
                <div className="absolute inset-0 z-0">
                    <Image
                        src={optimizedImageSrc}
                        alt={imageAlt}
                        fill
                        sizes="45vw"
                        className="object-cover opacity-60 mix-blend-luminosity blur-[5px] scale-105"
                    />
                    <div className="absolute inset-0 bg-linear-to-br from-primary/80 to-accent/40 mix-blend-overlay" />
                    <div className="absolute right-0 top-0 size-125 translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-[120px]" />
                    <div className="absolute bottom-0 left-0 size-100 -translate-x-1/2 translate-y-1/2 rounded-full bg-accent/20 blur-[100px]" />
                    <div className="absolute inset-0 bg-zinc-950/40" />
                </div>

                <div className="relative z-10 flex items-center justify-between">
                    <Link
                        href="/"
                        aria-label="Ir para a página inicial da Global English"
                        className={cn(
                            "flex items-center gap-3 rounded-full text-sm font-semibold tracking-tight transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-4 focus-visible:ring-offset-transparent",
                            primaryColorTheme && "text-white",
                        )}
                    >
                        <span className="flex size-10 items-center justify-center rounded-[13px] border border-white/20 bg-white/10 shadow-lg backdrop-blur-xl">
                            <Logo className="size-6" />
                        </span>
                        <span className="text-xl tracking-[-0.03em]">Global English</span>
                    </Link>
                    <span className="hidden rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-white/60 backdrop-blur-xl xl:inline-flex">Auth space</span>
                </div>

                <div className="relative z-10 mt-24 max-w-lg space-y-8">
                    {badgeText && (
                        <div className={cn(
                            "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium backdrop-blur-xl",
                            primaryColorTheme ? "bg-white/10 text-white border border-white/20" : "border border-zinc-700/50 bg-zinc-800/50 text-zinc-300"
                        )}>
                            {badgeText}
                        </div>
                    )}

                    <h1 className={cn("text-4xl font-semibold tracking-[-0.05em] leading-[1.05] xl:text-5xl", primaryColorTheme ? "text-white" : "text-zinc-50")}>
                        {title}
                    </h1>

                    {description && (
                        <p className={cn("max-w-md text-base leading-7", primaryColorTheme ? "text-white/75" : "text-zinc-400")}>
                            {description}
                        </p>
                    )}
                </div>

                {bottomContent}
            </div>

            {/* Form Pane */}
            <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-background p-5 sm:p-8 lg:p-12">
                {/* Subtle background glow for mobile */}
                {!primaryColorTheme && <div className="absolute inset-0 -z-10 bg-linear-to-b from-primary/8 via-transparent to-accent/5 lg:hidden" />}

                <div className="relative z-10 w-full max-w-105 space-y-7 auth-card-enter">
                    <Link
                        href="/"
                        aria-label="Ir para a página inicial da Global English"
                        className="flex items-center justify-center gap-3 rounded-full text-sm font-bold tracking-tight transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-background lg:hidden"
                    >
                        <Logo className="size-10 text-primary" />
                        <span className="text-xl">Global English</span>
                    </Link>
                    {children}
                </div>
            </div>
        </div>
    )
}
