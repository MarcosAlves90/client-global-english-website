"use client"

import Link from "next/link"
import { ArrowRight, type LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface AdminNavCardProps {
    title: string
    description: string
    href: string
    icon: LucideIcon
    className?: string
}

export function AdminNavCard({
    title,
    description,
    href,
    icon: Icon,
    className,
}: AdminNavCardProps) {
    return (
        <Link href={href} className="block group">
            <Card className={cn(
                "relative overflow-hidden transition-all duration-300",
                "bg-card/50 backdrop-blur-sm border-primary/10 border-dashed",
                "hover:bg-primary/3 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5",
                "active:scale-[0.98]",
                className
            )}>
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Icon className="size-24 -mr-8 -mt-8" />
                </div>

                <CardContent className="p-6 flex items-start gap-4">
                    <div className="rounded-xl bg-primary/10 p-3 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                        <Icon className="size-6" />
                    </div>

                    <div className="flex-1 space-y-1 pr-6">
                        <h3 className="font-semibold text-lg tracking-tight transition-colors group-hover:text-primary">
                            {title}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            {description}
                        </p>
                    </div>

                    <div className="self-center">
                        <ArrowRight className="size-5 text-muted-foreground transition-all duration-300 group-hover:translate-x-1 group-hover:text-primary" />
                    </div>
                </CardContent>
            </Card>
        </Link>
    )
}
