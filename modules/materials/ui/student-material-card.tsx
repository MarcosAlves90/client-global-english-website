"use client";

import * as React from "react";
import {
    FileAudio,
    FileText,
    Link as LinkIcon,
    Video,
    ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Material } from "@/lib/firebase/types";

interface StudentMaterialCardProps {
    material: Material;
    className?: string;
}

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    video: Video,
    audio: FileAudio,
    link: LinkIcon,
    pdf: FileText,
};

const typeLabels: Record<string, string> = {
    video: "Vídeo",
    audio: "Áudio",
    link: "Link Externo",
    pdf: "Documento PDF",
};

export function StudentMaterialCard({ material, className }: StudentMaterialCardProps) {
    const attachments = material.attachments ?? [];
    const attachmentType = attachments.find((item) => item.type)?.type;
    const baseType = (attachmentType ?? (material.type || "pdf")) as keyof typeof typeIcons;
    const Icon = typeIcons[baseType] || FileText;

    const detailParts: string[] = [];
    if (material.markdown?.trim()) detailParts.push("Texto");
    if (attachments.length) detailParts.push(`${attachments.length} Anexo${attachments.length > 1 ? "s" : ""}`);
    if (material.url?.trim() && !attachments.length) detailParts.push("Referência");

    return (
        <Card className={cn(
            "group relative flex flex-col overflow-hidden border-primary/20 bg-card/40 backdrop-blur-sm transition-all duration-500",
            "hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1.5",
            className
        )}>
            <CardContent className="flex flex-col gap-4 p-5">
                <div className="flex items-start justify-between">
                    <div className="rounded-2xl bg-primary/5 p-3 text-primary group-hover:bg-primary/10 group-hover:scale-110 transition-all duration-500">
                        <Icon className="size-6" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/30 group-hover:text-primary/40 transition-colors">
                        {typeLabels[baseType] || "Material"}
                    </span>
                </div>

                <div className="space-y-1.5">
                    <h3 className="line-clamp-1 text-base font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
                        {material.title}
                    </h3>
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-tight text-muted-foreground/60">
                        <span>{detailParts.join(" • ")}</span>
                    </div>
                </div>

                <div className="mt-2 flex items-center justify-between border-t border-primary/5 pt-4">
                    <span className="text-[10px] font-bold text-muted-foreground/40 italic">
                        {material.trackId ? "Módulo" : "Curso"}
                    </span>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 rounded-full px-4 text-xs font-bold hover:bg-primary/10 hover:text-primary transition-all group/btn"
                    >
                        Acessar
                        <ChevronRight className="ml-1 size-3.5 transition-transform group-hover/btn:translate-x-1" />
                    </Button>
                </div>
            </CardContent>

            {/* Glossy overlay */}
            <div className="absolute inset-0 pointer-events-none bg-linear-to-tr from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </Card>
    );
}
