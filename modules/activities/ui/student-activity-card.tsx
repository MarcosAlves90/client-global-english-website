"use client";

import * as React from "react";
import {
    Clock,
    Play,
    CheckCircle2,
    BookOpen,
    Video,
    FileText,
    Target,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface StudentActivityCardProps {
    activity: {
        id: string;
        title: string;
        courseTitle: string;
        trackTitle?: string;
        type: string;
        estimatedMinutes: number;
        status?: "pending" | "completed" | "in_progress";
    };
    variant?: "default" | "compact";
    className?: string;
    onOpen?: (id: string) => void;
    onComplete?: (id: string) => void;
}

const typeIcons: Record<string, any> = {
    video: Video,
    quiz: Target,
    lesson: BookOpen,
    assignment: FileText,
};

const statusStyles: Record<string, string> = {
    pending: "bg-muted text-muted-foreground",
    in_progress: "bg-primary/10 text-primary border-primary/20",
    completed: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
};

export function StudentActivityCard({
    activity,
    variant = "default",
    className,
    onOpen,
    onComplete,
}: StudentActivityCardProps) {
    const Icon = typeIcons[activity.type] || BookOpen;
    const status = activity.status || "in_progress";

    if (variant === "compact") {
        return (
            <div className={cn(
                "group relative flex items-center justify-between gap-4 overflow-hidden rounded-2xl border border-primary/10 bg-card/40 backdrop-blur-sm p-3 transition-all duration-300",
                "hover:bg-primary/5 hover:border-primary/20 hover:shadow-lg hover:-translate-y-0.5",
                className
            )}>
                <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-primary/10 p-2 text-primary group-hover:bg-primary/20 transition-colors">
                        <Icon className="size-4" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold tracking-tight text-foreground line-clamp-1">{activity.title}</h4>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 line-clamp-1">
                            {activity.courseTitle}
                        </p>
                    </div>
                </div>
                <Button
                    size="icon"
                    variant="ghost"
                    className="size-8 rounded-full hover:bg-primary/10 hover:text-primary"
                    onClick={() => onOpen?.(activity.id)}
                >
                    <Play className="size-3.5 fill-current" />
                </Button>
            </div>
        );
    }

    return (
        <Card className={cn(
            "group flex flex-col overflow-hidden border-primary/10 bg-card/40 backdrop-blur-sm transition-all duration-500",
            "hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1.5",
            className
        )}>
            <CardContent className="flex flex-col gap-4 p-5">
                <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                            <span className={cn(
                                "rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest border",
                                statusStyles[status]
                            )}>
                                {status === "in_progress" ? "Em andamento" : status === "completed" ? "Concluído" : "Pendente"}
                            </span>
                            <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40">
                                {activity.type}
                            </span>
                        </div>
                        <h3 className="line-clamp-2 text-base font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
                            {activity.title}
                        </h3>
                        <p className="text-xs font-medium text-muted-foreground/60">
                            {activity.courseTitle} {activity.trackTitle ? `• ${activity.trackTitle}` : ""}
                        </p>
                    </div>
                    <div className="rounded-2xl bg-primary/5 p-3 text-primary/40 group-hover:bg-primary/10 group-hover:text-primary transition-all duration-500">
                        <Icon className="size-6" />
                    </div>
                </div>

                <div className="flex items-center gap-4 border-y border-primary/5 py-3 my-1">
                    <div className="flex items-center gap-1.5 text-muted-foreground/60">
                        <Clock className="size-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-tight">{activity.estimatedMinutes || 15} Minutos</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        size="sm"
                        className="flex-1 rounded-full font-bold shadow-lg shadow-primary/10 active:scale-95 group/btn"
                        onClick={() => onOpen?.(activity.id)}
                    >
                        <Play className="mr-2 size-3 fill-current transition-transform group-hover/btn:scale-110" />
                        Iniciar Atividade
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full font-bold border-primary/10 hover:border-emerald-500/30 hover:text-emerald-500 hover:bg-emerald-500/5 active:scale-95"
                        onClick={() => onComplete?.(activity.id)}
                    >
                        <CheckCircle2 className="mr-2 size-3.5" />
                        Concluir
                    </Button>
                </div>
            </CardContent>

            {/* Decorative bottom glow */}
            <div className="absolute -bottom-1 left-0 h-[2px] w-full bg-linear-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </Card>
    );
}
