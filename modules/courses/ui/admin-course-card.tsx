"use client";

import * as React from "react";
import Link from "next/link";
import {
    BookOpenCheck,
    ClipboardList,
    Layers3,
    Calendar,
    Users2,
    X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { AdminCourseSummary } from "@/lib/firebase/types";

import {
    STATUS_STYLES,
    type CourseStatus,
} from "@/modules/courses/model/course";

type AdminCourseCardProps = {
    course: AdminCourseSummary;
    onEdit: (course: AdminCourseSummary) => void;
    onDelete: (course: AdminCourseSummary) => void;
    deleting?: boolean;
};

export function AdminCourseCard({
    course,
    onEdit,
    onDelete,
    deleting = false,
}: AdminCourseCardProps) {
    const [imageError, setImageError] = React.useState(false);

    React.useEffect(() => {
        setImageError(false);
    }, [course.coverUrl]);

    return (
        <Card className="group flex py-0 rounded-b-none h-full flex-col overflow-hidden border-primary/20 bg-card/40 backdrop-blur-sm transition-all duration-500 hover:-translate-y-1.5 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5">
            <div className="relative aspect-16/10 w-full overflow-hidden border-b border-primary/20 bg-muted/30">
                {course.coverUrl && !imageError ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={course.coverUrl}
                        alt={course.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-zinc-200 dark:bg-zinc-800">
                        <BookOpenCheck className="size-10 text-zinc-400 dark:text-zinc-500" />
                    </div>
                )}

                <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                    <span
                        className={cn(
                            "inline-flex items-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider shadow-lg backdrop-blur-md border border-white/5",
                            STATUS_STYLES[
                            (course.status as CourseStatus) ??
                            "Inscrições abertas"
                            ] ?? STATUS_STYLES["Inscrições abertas"],
                        )}
                    >
                        {course.status}
                    </span>
                </div>

                <div className="absolute right-3 top-3">
                    <span className="rounded-full bg-black/40 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg backdrop-blur-md border border-white/5">
                        {course.level}
                    </span>
                </div>
            </div>

            <CardContent className="flex flex-1 flex-col px-4 pb-4">
                <div className="mb-4">
                    <h3 className="line-clamp-1 text-base font-bold text-foreground">
                        {course.title}
                    </h3>
                    <p className="mt-1.5 line-clamp-2 min-h-8 text-xs text-muted-foreground leading-relaxed">
                        {course.description ||
                            "Sem descrição disponível para este treinamento."}
                    </p>
                </div>

                <div className="mt-auto grid grid-cols-3 gap-2 border-y border-primary/5 py-3">
                    <div className="flex flex-col items-center justify-center gap-1 border-r border-primary/5">
                        <Users2 className="size-3.5 text-primary/60" />
                        <span className="text-xs font-bold text-foreground">
                            {course.studentsCount}
                        </span>
                        <span className="text-[9px] uppercase tracking-tighter text-muted-foreground font-medium">Alunos</span>
                    </div>
                    <div className="flex flex-col items-center justify-center gap-1 border-r border-primary/5">
                        <Layers3 className="size-3.5 text-primary/60" />
                        <span className="text-xs font-bold text-foreground">
                            {course.modulesCount}
                        </span>
                        <span className="text-[9px] uppercase tracking-tighter text-muted-foreground font-medium">Módulos</span>
                    </div>
                    <div className="flex flex-col items-center justify-center gap-1">
                        <ClipboardList className="size-3.5 text-primary/60" />
                        <span className="text-xs font-bold text-foreground">
                            {course.activitiesCount}
                        </span>
                        <span className="text-[9px] uppercase tracking-tighter text-muted-foreground font-medium">Ativs.</span>
                    </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5 text-muted-foreground/60">
                        <Calendar className="size-3.5" />
                        <span className="text-[10px] font-bold">
                            {course.durationWeeks} Sems.
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            size="icon"
                            variant="ghost"
                            className="size-8 text-muted-foreground hover:bg-primary/10 hover:text-primary rounded-full transition-all"
                            onClick={() => onEdit(course)}
                        >
                            <Calendar className="size-4" />
                        </Button>
                        <Button
                            size="icon"
                            variant="ghost"
                            className="size-8 text-destructive hover:bg-destructive/10 rounded-full transition-all"
                            onClick={() => onDelete(course)}
                            disabled={deleting}
                        >
                            <X className="size-4" />
                        </Button>
                        <Button
                            size="sm"
                            className="h-8 px-4 text-[10px] font-bold uppercase tracking-wider rounded-full shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-all active:scale-95"
                            asChild
                        >
                            <Link href={`/dashboard/admin/courses/${course.id}`}>
                                Abrir
                            </Link>
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
