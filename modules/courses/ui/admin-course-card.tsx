"use client";

import * as React from "react";
import {
    BookOpenCheck,
    ClipboardList,
    Layers3,
    Calendar,
    Users2,
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
};

export function AdminCourseCard({ course, onEdit }: AdminCourseCardProps) {
    const [imageError, setImageError] = React.useState(false);

    React.useEffect(() => {
        setImageError(false);
    }, [course.coverUrl]);

    return (
        <Card className="group py-0 flex h-full flex-col rounded-t-none overflow-hidden border-neutral-200 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-neutral-800">
            <div className="relative aspect-video w-full overflow-hidden border-b border-neutral-100 bg-muted/30 dark:border-neutral-800">
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
                            "inline-flex items-center px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-sm backdrop-blur-sm",
                            STATUS_STYLES[
                            (course.status as CourseStatus) ??
                            "Inscrições abertas"
                            ] ?? STATUS_STYLES["Inscrições abertas"],
                        )}
                    >
                        {course.status}
                    </span>
                </div>

                <div className="absolute right-3 top-3 flex flex-wrap">
                    <span className="bg-black/60 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
                        {course.level}
                    </span>
                </div>
            </div>

            <CardContent className="flex flex-1 flex-col px-4 pb-4">
                <div>
                    <h3 className="line-clamp-1 text-lg leading-tight font-bold text-neutral-900 dark:text-neutral-100">
                        {course.title}
                    </h3>
                    <p className="mt-1.5 line-clamp-2 min-h-10 text-sm text-neutral-500 dark:text-neutral-400">
                        {course.description ||
                            "Sem descrição disponível para este treinamento."}
                    </p>
                </div>

                <div className="mt-auto grid grid-cols-3 gap-2 border-y border-neutral-100 py-2 dark:border-neutral-800">
                    <div className="flex items-center text-center justify-center gap-2">
                        <Users2 className="size-4 text-neutral-400" />
                        <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                            {course.studentsCount}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 justify-center border-x border-neutral-100 text-center dark:border-neutral-800">
                        <Layers3 className="size-4 text-neutral-400" />
                        <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                            {course.modulesCount}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-center justify-center">
                        <ClipboardList className="size-4 text-neutral-400" />
                        <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                            {course.activitiesCount}
                        </span>
                    </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5 text-neutral-500">
                        <Calendar className="size-3.5" />
                        <span className="text-xs font-medium">
                            {course.durationWeeks}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-3 text-xs font-semibold"
                            onClick={() => onEdit(course)}
                        >
                            Editar
                        </Button>
                        <Button
                            size="sm"
                            className="h-8 px-4 text-xs font-semibold shadow-sm"
                        >
                            Gerenciar
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
