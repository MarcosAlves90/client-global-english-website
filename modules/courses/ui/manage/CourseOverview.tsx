"use client"

import * as React from "react"
import {
    BookOpen,
    Clock,
    Layers3,
    Users2,
    FileText,
    Target,
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardSectionHeader } from "@/components/dashboard-section-header"
import { useCourseManagement } from "./CourseManagementContext"

export function     CourseOverview() {
    const { course, tracks, materials, activities } = useCourseManagement()

    if (!course) return null

    const stats = [
        {
            label: "Módulos",
            value: tracks.length,
            icon: Layers3,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
        },
        {
            label: "Materiais",
            value: materials.length,
            icon: FileText,
            color: "text-purple-500",
            bg: "bg-purple-500/10",
        },
        {
            label: "Atividades",
            value: activities.length,
            icon: Target,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
        },
        {
            label: "Duração Est.",
            value: `${activities.reduce((acc, curr) => acc + (curr.estimatedMinutes || 0), 0)} min`,
            icon: Clock,
            color: "text-amber-500",
            bg: "bg-amber-500/10",
        }
    ]

    return (
        <div className="space-y-6">
            <DashboardSectionHeader
                icon={BookOpen}
                title="Visão Geral"
                description="Resumo do curso, distribuição de conteúdo por módulo e métricas gerais."
            />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <Card key={stat.label} className="border-primary/20 border-dashed bg-card/40 backdrop-blur-sm group hover:border-primary/50 transition-all">
                        <CardContent className="px-6 py-2">
                            <div className="flex items-center justify-between">
                                <div className={`p-2 rounded-xl ${stat.bg} ${stat.color}`}>
                                    <stat.icon className="size-5" />
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">{stat.label}</p>
                                    <p className="text-2xl font-bold tracking-tighter mt-1">{stat.value}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="border-primary/20 bg-card/40 backdrop-blur-md">
                    <CardHeader>
                        <CardTitle className="text-base font-bold">Resumo do Curso</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-start gap-4 p-4 rounded-xl bg-primary/5 border border-dashed border-primary/30">
                            <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                <BookOpen className="size-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg leading-none">{course.title}</h3>
                                <p className="text-xs text-muted-foreground mt-2 line-clamp-3 leading-relaxed">
                                    {course.description || "Nenhuma descrição fornecida para este curso."}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4">
                            <div className="p-4 rounded-2xl border border-primary/5 bg-background/40">
                                <div className="flex items-center gap-2 mb-2">
                                    <Users2 className="size-3 text-primary/40" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">Status do Curso</span>
                                </div>
                                <p className="text-sm font-bold uppercase tracking-widest text-emerald-500">Ativo na Plataforma</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-primary/20 bg-card/40 backdrop-blur-md">
                    <CardHeader>
                        <CardTitle className="text-base font-bold">Distribuição por Módulo</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {tracks.length === 0 ? (
                                <p className="text-xs text-muted-foreground/40 text-center py-8 italic">Nenhum módulo cadastrado ainda.</p>
                            ) : (
                                tracks.slice(0, 5).map(track => {
                                    const mCount = materials.filter(m => m.trackId === track.id).length
                                    const aCount = activities.filter(a => a.trackId === track.id).length
                                    return (
                                        <div key={track.id} className="flex items-center justify-between p-3 rounded-xl border border-primary/5 bg-primary/1 group hover:border-primary/20 transition-all">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/40 mb-1">Módulo {track.order}</span>
                                                <span className="text-xs font-bold">{track.title}</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <div className="px-2 py-1 rounded-md bg-background/50 border border-primary/5 text-[10px] font-bold text-muted-foreground">
                                                    {mCount} Mat.
                                                </div>
                                                <div className="px-2 py-1 rounded-md bg-background/50 border border-primary/5 text-[10px] font-bold text-muted-foreground">
                                                    {aCount} Ativ.
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
