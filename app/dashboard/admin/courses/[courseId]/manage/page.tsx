"use client"

import * as React from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, Layers3, FileText, ClipboardList, BookOpen, AlertCircle, Plus } from "lucide-react"

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
  const [showCreateTrackPanel, setShowCreateTrackPanel] = React.useState(false)
  const [showCreateMaterialPanel, setShowCreateMaterialPanel] = React.useState(false)
  const [showCreateActivityPanel, setShowCreateActivityPanel] = React.useState(false)

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
  const activeSectionMeta = sections.find((section) => section.id === activeSection) ?? sections[0]
  const ActiveSectionIcon = activeSectionMeta.icon
  const isModulesSection = activeSection === "modules"
  const isMaterialsSection = activeSection === "materials"
  const isActivitiesSection = activeSection === "activities"
  const isCreatePanelOpen = isModulesSection
    ? showCreateTrackPanel
    : isMaterialsSection
      ? showCreateMaterialPanel
      : isActivitiesSection
        ? showCreateActivityPanel
        : false

  const handleToggleCreatePanel = () => {
    if (isModulesSection) {
      setShowCreateTrackPanel((prev) => !prev)
      return
    }
    if (isMaterialsSection) {
      setShowCreateMaterialPanel((prev) => !prev)
      return
    }
    if (isActivitiesSection) {
      setShowCreateActivityPanel((prev) => !prev)
    }
  }

  return (
    <CourseManagementProvider>
      <div className="min-h-screen bg-background/50">
        <DashboardHeader
          title="Gestão do Curso"
          breadcrumbItems={breadcrumbItems}
          description="Estruture o conteúdo, defina trilhas e acompanhe o engajamento."
          action={
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm" className="hidden sm:flex hover:bg-primary/5">
                <Link href={courseId ? `/dashboard/admin/courses/${courseId}` : "/dashboard/admin/courses"}>
                  <ArrowLeft className="mr-2 size-4" />
                  Voltar
                </Link>
              </Button>
              {(isModulesSection || isMaterialsSection || isActivitiesSection) ? (
                <Button
                  size="sm"
                  onClick={handleToggleCreatePanel}
                  className="shadow-lg shadow-primary/10"
                  variant={isCreatePanelOpen ? "outline" : "default"}
                >
                  <Plus className="mr-2 size-4" />
                  {isCreatePanelOpen
                    ? "Fechar criação"
                    : isModulesSection
                      ? "Criar módulo"
                      : isMaterialsSection
                      ? "Criar material"
                      : "Criar atividade"}
                </Button>
              ) : null}
            </div>
          }
        />

        <div className="flex flex-col gap-8 p-6 lg:p-10">
          {!isFirebaseReady ? (
            <div className="rounded-2xl border border-dashed border-amber-500/20 bg-amber-500/5 p-4 text-xs font-medium text-amber-500/80 backdrop-blur-sm animate-in fade-in slide-in-from-top-2">
              Firebase em processo de sincronização...
            </div>
          ) : null}

          {/* Mobile Section Selector */}
          <div className="md:hidden space-y-2">
            <label htmlFor="course-section-select" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
              Navegação do Curso
            </label>
            <div className="relative rounded-2xl border border-primary/20 bg-card/60 p-1 backdrop-blur-md">
              <ActiveSectionIcon className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-primary" />
              <select
                id="course-section-select"
                value={activeSection}
                onChange={(event) => setActiveSection(event.target.value as SectionId)}
                className="h-11 w-full appearance-none rounded-xl border border-primary/10 bg-background/70 py-2 pr-10 pl-10 text-sm font-semibold text-foreground outline-none transition-all focus:border-primary/30 focus:ring-2 focus:ring-primary/15"
              >
                {sections.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <div
            role="tablist"
            aria-label="Seções de gestão do curso"
            className="hidden md:block"
          >
            <div className="inline-flex min-w-max items-center gap-1 rounded-2xl border border-dashed border-primary/20 bg-primary/5 p-1 backdrop-blur-md">
              {sections.map((section) => {
                const Icon = section.icon
                const isActive = activeSection === section.id
                const tabId = `course-manage-tab-${section.id}`
                const panelId = `course-manage-panel-${section.id}`

                return (
                  <button
                    key={section.id}
                    id={tabId}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-controls={panelId}
                    onClick={() => setActiveSection(section.id)}
                    className={`shrink-0 whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-bold tracking-tight transition-all ${isActive
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                      : "text-muted-foreground hover:bg-primary/5 hover:text-foreground"
                      }`}
                  >
                    <span className="flex items-center gap-2">
                      <Icon className="size-3.5" />
                      {section.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Main Content Areas */}
          <div className="animate-in fade-in slide-in-from-bottom-2 transition-all duration-300">
            <div
              id="course-manage-panel-overview"
              role="tabpanel"
              aria-labelledby="course-manage-tab-overview"
              hidden={activeSection !== "overview"}
            >
              {activeSection === "overview" && <CourseOverview />}
            </div>
            <div
              id="course-manage-panel-modules"
              role="tabpanel"
              aria-labelledby="course-manage-tab-modules"
              hidden={activeSection !== "modules"}
            >
              {activeSection === "modules" && (
                <TrackManagement
                  showCreatePanel={showCreateTrackPanel}
                  onRequestOpenCreatePanel={() => setShowCreateTrackPanel(true)}
                />
              )}
            </div>
            <div
              id="course-manage-panel-materials"
              role="tabpanel"
              aria-labelledby="course-manage-tab-materials"
              hidden={activeSection !== "materials"}
            >
              {activeSection === "materials" && (
                <MaterialManagement showCreatePanel={showCreateMaterialPanel} />
              )}
            </div>
            <div
              id="course-manage-panel-activities"
              role="tabpanel"
              aria-labelledby="course-manage-tab-activities"
              hidden={activeSection !== "activities"}
            >
              {activeSection === "activities" && (
                <ActivityManagement showCreatePanel={showCreateActivityPanel} />
              )}
            </div>
          </div>
        </div>
      </div>
    </CourseManagementProvider>
  )
}
