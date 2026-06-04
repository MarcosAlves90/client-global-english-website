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
        <div className={cn("min-h-svh bg-background flex flex-col", reverseLayout ? "lg:flex-row-reverse" : "lg:flex-row")}>
            {/* Informational Pane */}
            <div className={cn("relative hidden lg:flex flex-col justify-between w-[45%] p-12 overflow-hidden", primaryColorTheme ? "bg-primary text-primary-foreground" : "bg-zinc-950 text-zinc-50")}>
                {/* Abstract Background for Premium Feel */}
                <div className="absolute inset-0 z-0">
                    <Image
                        src={optimizedImageSrc}
                        alt={imageAlt}
                        fill
                        sizes="45vw"
                        className="object-cover opacity-60 mix-blend-luminosity blur-[5px] scale-105"
                    />
                    {primaryColorTheme ? (
                        <>
                            <div className="absolute inset-0 bg-linear-to-br from-black/60 to-transparent mix-blend-overlay"></div>
                            <div className="absolute top-0 right-0 w-125 h-125 rounded-full bg-white/10 blur-[100px] translate-x-1/3 -translate-y-1/3"></div>
                            <div className="absolute bottom-0 left-0 w-150 h-150 rounded-full bg-black/10 blur-[120px] -translate-x-1/2 translate-y-1/2"></div>
                            <div className="absolute inset-0 bg-primary/40 mix-blend-multiply"></div>
                        </>
                    ) : (
                        <>
                            <div className="absolute inset-0 bg-linear-to-br from-primary/80 to-accent/40 mix-blend-overlay"></div>
                            <div className="absolute top-0 right-0 w-125 h-125 rounded-full bg-primary/20 blur-[120px] translate-x-1/2 -translate-y-1/2"></div>
                            <div className="absolute bottom-0 left-0 w-100 h-100 rounded-full bg-accent/20 blur-[100px] -translate-x-1/2 translate-y-1/2"></div>
                            <div className="absolute inset-0 bg-zinc-950/40"></div>
                        </>
                    )}
                </div>

                <div className={cn("relative z-10 flex", reverseLayout ? "justify-end" : "justify-start")}>
                    <Link
                        href="/"
                        aria-label="Ir para a página inicial da Global English"
                        className={cn(
                            "flex items-center gap-3 text-sm font-semibold tracking-tight transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-4 focus-visible:ring-offset-transparent rounded-full",
                            primaryColorTheme && "text-white",
                        )}
                    >
                        {!reverseLayout && <Logo className="size-10" />}
                        <span className="text-xl">Global English</span>
                        {reverseLayout && <Logo className="size-10" />}
                    </Link>
                </div>

                <div className="relative z-10 space-y-8 max-w-lg mt-24">
                    {badgeText && (
                        <div className={cn(
                            "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium backdrop-blur-sm",
                            primaryColorTheme ? "bg-white/10 text-white border border-white/20" : "border border-zinc-700/50 bg-zinc-800/50 text-zinc-300"
                        )}>
                            {badgeText}
                        </div>
                    )}

                    <h1 className={cn("text-4xl font-bold tracking-tight leading-[1.15]", primaryColorTheme ? "text-white" : "text-zinc-50")}>
                        {title}
                    </h1>

                    {description && (
                        <p className={cn("text-lg leading-relaxed", primaryColorTheme ? "text-white/80" : "text-zinc-400")}>
                            {description}
                        </p>
                    )}
                </div>

                {bottomContent}
            </div>

            {/* Form Pane */}
            <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative overflow-hidden bg-background">
                {/* Subtle background glow for mobile */}
                {!primaryColorTheme && <div className="absolute inset-0 lg:hidden -z-10 bg-linear-to-b from-primary/5 to-transparent"></div>}

                <div className="w-full max-w-105 space-y-8 relative z-10">
                    <Link
                        href="/"
                        aria-label="Ir para a página inicial da Global English"
                        className="flex items-center justify-center gap-3 text-sm font-bold tracking-tight lg:hidden transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-background rounded-full"
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
