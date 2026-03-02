"use client"

import * as React from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, Layers3, FileText, ClipboardList, BookOpen, AlertCircle } from "lucide-react"

import { DashboardHeader } from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/hooks/use-auth"
import { CourseManagementProvider } from "@/modules/courses/ui/manage/CourseManagementContext"
import { TrackManagement } from "@/modules/courses/ui/manage/TrackManagement"
import { MaterialManagement } from "@/modules/courses/ui/manage/MaterialManagement"
import { ActivityManagement } from "@/modules/courses/ui/manage/ActivityManagement"
import { CourseOverview } from "@/modules/courses/ui/manage/CourseOverview"

type SectionId = "overview" | "modules" | "materials" | "activities"

export default function Page() {
  const { role, isFirebaseReady } = useAuth()
  const params = useParams<{ courseId?: string }>()
  const courseId = Array.isArray(params?.courseId) ? params.courseId[0] : params?.courseId

  const [activeSection, setActiveSection] = React.useState<SectionId>("overview")

  const breadcrumbItems = React.useMemo(() => [
    { label: "Admin", href: "/dashboard/admin" },
    { label: "Cursos", href: "/dashboard/admin/courses" },
    { label: "Gestão do Curso" },
  ], [])

  if (role !== "admin") {
    return (
      <div className="min-h-screen bg-background/50">
        <DashboardHeader title="Gestão do Curso" breadcrumbItems={breadcrumbItems} />
        <div className="flex h-[calc(100vh-8rem)] items-center justify-center p-6">
          <Card className="max-w-md border-destructive/20 bg-destructive/5 text-center">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center justify-center gap-2">
                <AlertCircle className="size-5 text-destructive" />
                Acesso Restrito
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Esta área é exclusiva para administradores da plataforma.
              <div className="mt-6">
                <Button asChild variant="outline" size="sm">
                  <Link href="/dashboard">Voltar ao Início</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const sections = [
    { id: "overview", label: "Geral", icon: BookOpen },
    { id: "modules", label: "Módulos", icon: Layers3 },
    { id: "materials", label: "Materiais", icon: FileText },
    { id: "activities", label: "Atividades", icon: ClipboardList },
  ] as const

  return (
    <CourseManagementProvider>
      <div className="min-h-screen bg-background/50">
        <DashboardHeader
          title="Gestão do Curso"
          breadcrumbItems={breadcrumbItems}
          description="Estruture o conteúdo, defina trilhas e acompanhe o engajamento."
          action={
            <Button asChild variant="ghost" size="sm" className="hidden sm:flex hover:bg-primary/5">
              <Link href={courseId ? `/dashboard/admin/courses/${courseId}` : "/dashboard/admin/courses"}>
                <ArrowLeft className="mr-2 size-4" />
                Voltar
              </Link>
            </Button>
          }
        />

        <div className="flex flex-col gap-8 p-6 lg:p-10">
          {!isFirebaseReady ? (
            <div className="rounded-2xl border border-dashed border-amber-500/20 bg-amber-500/5 p-4 text-xs font-medium text-amber-500/80 backdrop-blur-sm animate-in fade-in slide-in-from-top-2">
              Firebase em processo de sincronização...
            </div>
          ) : null}

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-primary/5 border border-dashed border-primary/20 w-fit backdrop-blur-md">
            {sections.map((section) => {
              const Icon = section.icon
              const isActive = activeSection === section.id
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold tracking-tight transition-all ${isActive
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "text-muted-foreground hover:bg-primary/5 hover:text-foreground"
                    }`}
                >
                  <Icon className="size-3.5" />
                  {section.label}
                </button>
              )
            })}
          </div>

          {/* Main Content Areas */}
          <div className="transition-all duration-300 animate-in fade-in slide-in-from-bottom-2">
            {activeSection === "overview" && <CourseOverview />}
            {activeSection === "modules" && <TrackManagement />}
            {activeSection === "materials" && <MaterialManagement />}
            {activeSection === "activities" && <ActivityManagement />}
          </div>
        </div>
      </div>
    </CourseManagementProvider>
  )
}
