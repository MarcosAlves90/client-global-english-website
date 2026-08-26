"use client"

import Link from "next/link"
import { ArrowRight, type LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface DashboardNavCardProps {
    title: string
    description: string
    href: string
    icon: LucideIcon
    className?: string
}

export function DashboardNavCard({
    title,
    description,
    href,
    icon: Icon,
    className,
}: DashboardNavCardProps) {
    return (
        <Link href={href} className="block group">
            <Card className={cn(
                "relative overflow-hidden transition-all duration-300",
                "hover:-translate-y-0.5 hover:border-primary/25 hover:bg-card/85 hover:shadow-xl hover:shadow-primary/5",
                "active:scale-[0.98]",
                className
            )}>
                <CardContent className="p-6 flex items-start gap-4">
                    <div className="ge-icon-tile rounded-full p-3 transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-105">
                        <Icon className="size-6" />
                    </div>

                    <div className="flex-1 space-y-1 pr-6">
                        <h3 className="text-lg font-semibold tracking-[-0.025em] text-foreground transition-colors group-hover:text-primary">
                            {title}
                        </h3>
                        <p className="text-sm leading-relaxed text-muted-foreground">
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
