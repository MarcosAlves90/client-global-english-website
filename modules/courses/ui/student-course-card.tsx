"use client";

import * as React from "react";
import Link from "next/link";
import {
    BookOpen,
    CalendarClock,
    ClipboardList,
    Play,
    Zap,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DashboardCourse } from "@/lib/firebase/types";

interface StudentCourseCardProps {
    course: DashboardCourse;
    variant?: "horizontal" | "vertical";
    className?: string;
}

const statusLabels: Record<string, string> = {
    active: "Em andamento",
    completed: "Concluído",
    paused: "Pausado",
};

const statusStyles: Record<string, string> = {
    active: "bg-primary/10 text-primary border-primary/20",
    completed: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    paused: "bg-amber-500/10 text-amber-500 border-amber-500/20",
};

export function StudentCourseCard({
    course,
    variant = "vertical",
    className,
}: StudentCourseCardProps) {
    const [imageError, setImageError] = React.useState(false);

    if (variant === "horizontal") {
        return (
            <div className={cn(
                "group relative overflow-hidden rounded-2xl border border-primary/10 bg-card/40 backdrop-blur-sm p-4 transition-all duration-500",
                "hover:bg-primary/5 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1",
                className
            )}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                            <span className={cn(
                                "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest border",
                                statusStyles[course.enrollment.status] || statusStyles.active
                            )}>
                                {statusLabels[course.enrollment.status] || "Em andamento"}
                            </span>
                            <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                                • {course.level}
                            </span>
                        </div>
                        <div>
                            <h3 className="text-base font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
                                {course.title}
                            </h3>
                            <p className="line-clamp-1 text-xs text-muted-foreground/70 font-medium">
                                {course.description || "Inicie sua jornada neste treinamento exclusivo."}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex flex-col items-end gap-1">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">Progresso</span>
                            <span className="text-sm font-bold text-primary">{course.enrollment.progress}%</span>
                        </div>
                        <Button size="sm" className="rounded-full px-6 font-bold shadow-lg shadow-primary/10 active:scale-95" asChild>
                            <Link href={`/dashboard/courses/${course.id}`}>
                                <Play className="mr-2 size-3 fill-current" />
                                Continuar
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Progress bar at the bottom for horizontal version */}
                <div className="absolute bottom-0 left-0 h-1 w-full bg-primary/5">
                    <div
                        className="h-full bg-primary transition-all duration-1000 group-hover:bg-primary/80"
                        style={{ width: `${course.enrollment.progress}%` }}
                    />
                </div>
            </div>
        );
    }

    return (
        <Card className={cn(
            "group flex h-full flex-col overflow-hidden border-primary/10 bg-card/40 backdrop-blur-sm transition-all duration-500",
            "hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1.5",
            className
        )}>
            <div className="relative aspect-video w-full overflow-hidden border-b border-primary/10 bg-muted/30">
                {course.coverUrl && !imageError ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={course.coverUrl}
                        alt={course.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-primary/5">
                        <BookOpen className="size-10 text-primary/20" />
                    </div>
                )}

                <div className="absolute left-3 top-3">
                    <span className={cn(
                        "rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest border shadow-xl backdrop-blur-md",
                        statusStyles[course.enrollment.status] || statusStyles.active
                    )}>
                        {statusLabels[course.enrollment.status] || "Em andamento"}
                    </span>
                </div>

                <div className="absolute right-3 top-3">
                    <span className="rounded-full bg-black/60 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white shadow-xl backdrop-blur-md border border-white/10">
                        {course.level}
                    </span>
                </div>
            </div>

            <CardContent className="flex flex-1 flex-col gap-4 p-5">
                <div className="space-y-1.5">
                    <h3 className="line-clamp-1 text-lg font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
                        {course.title}
                    </h3>
                    <p className="line-clamp-2 text-xs font-medium leading-relaxed text-muted-foreground/70">
                        {course.description || "Plano de estudos exclusivo focado em conversação e resultados práticos."}
                    </p>
                </div>

                <div className="space-y-2.5 rounded-2xl border border-primary/5 bg-primary/5 p-4 group-hover:bg-primary/10 transition-colors">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Progresso geral</span>
                        <span className="text-xs font-bold text-primary">{course.enrollment.progress}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-primary/5">
                        <div
                            className="h-full rounded-full bg-primary transition-all duration-1000 shadow-[0_0_12px_rgba(var(--primary),0.3)]"
                            style={{ width: `${course.enrollment.progress}%` }}
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between border-t border-primary/5 pt-4 mt-auto">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 text-muted-foreground/60">
                            <ClipboardList className="size-3.5" />
                            <span className="text-[10px] font-bold uppercase tracking-tight">{course.tracks.length} Módulos</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground/60">
                            <Zap className="size-3.5" />
                            <span className="text-[10px] font-bold uppercase tracking-tight">{course.activities.length} Ativs.</span>
                        </div>
                    </div>
                    <Button size="sm" className="rounded-full px-6 font-bold shadow-lg shadow-primary/10 active:scale-95 group/btn" asChild>
                        <Link href={`/dashboard/courses/${course.id}`}>
                            <Play className="mr-2 size-3 fill-current transition-transform group-hover/btn:scale-110" />
                            Entrar
                        </Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
