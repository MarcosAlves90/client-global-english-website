"use client"

import * as React from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, BookOpen, ClipboardList, FileText, Layers3, Plus } from "lucide-react"

import { DashboardNotice } from "@/components/dashboard/dashboard-feedback"
import { DashboardPage } from "@/components/dashboard/dashboard-page"
import { SegmentedControl } from "@/components/dashboard/segmented-control"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { ActivityManagement } from "@/modules/courses/ui/manage/ActivityManagement"
import { CourseManagementProvider } from "@/modules/courses/ui/manage/CourseManagementContext"
import { CourseOverview } from "@/modules/courses/ui/manage/CourseOverview"
import { MaterialManagement } from "@/modules/courses/ui/manage/MaterialManagement"
import { TrackManagement } from "@/modules/courses/ui/manage/TrackManagement"

type SectionId = "overview" | "modules" | "materials" | "activities"

const sections = [
  { value: "overview", label: "Visão geral", icon: BookOpen },
  { value: "modules", label: "Módulos", icon: Layers3 },
  { value: "materials", label: "Materiais", icon: FileText },
  { value: "activities", label: "Atividades", icon: ClipboardList },
] satisfies Array<{ value: SectionId; label: string; icon: typeof BookOpen }>

export default function Page() {
  const { role, isFirebaseReady } = useAuth()
  const params = useParams<{ courseId?: string }>()
  const courseId = Array.isArray(params?.courseId) ? params.courseId[0] : params?.courseId

  const [activeSection, setActiveSection] = React.useState<SectionId>("overview")
  const [showCreateTrackPanel, setShowCreateTrackPanel] = React.useState(false)
  const [showCreateMaterialPanel, setShowCreateMaterialPanel] = React.useState(false)
  const [showCreateActivityPanel, setShowCreateActivityPanel] = React.useState(false)

  const breadcrumbItems = React.useMemo(
    () => [
      { label: "Admin", href: "/dashboard/admin" },
      { label: "Cursos", href: "/dashboard/admin/courses" },
      { label: "Gerenciar" },
    ],
    []
  )

  if (role !== "admin") {
    return (
      <DashboardPage title="Gerenciar curso" breadcrumbItems={breadcrumbItems}>
        <DashboardNotice tone="danger">Esta área é exclusiva para administradores.</DashboardNotice>
      </DashboardPage>
    )
  }

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
    if (isModulesSection) return setShowCreateTrackPanel((value) => !value)
    if (isMaterialsSection) return setShowCreateMaterialPanel((value) => !value)
    if (isActivitiesSection) setShowCreateActivityPanel((value) => !value)
  }

  const createLabel = isModulesSection
    ? "módulo"
    : isMaterialsSection
      ? "material"
      : "atividade"

  return (
    <CourseManagementProvider>
      <DashboardPage
        title="Gerenciar curso"
        breadcrumbItems={breadcrumbItems}
        description="Edite a estrutura do curso por contexto. Cada seção mantém apenas as ações relevantes ao conteúdo exibido."
        action={
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
              <Link href={courseId ? `/dashboard/admin/courses/${courseId}` : "/dashboard/admin/courses"}>
                <ArrowLeft className="size-4" />
                Resumo
              </Link>
            </Button>
            {isModulesSection || isMaterialsSection || isActivitiesSection ? (
              <Button size="sm" onClick={handleToggleCreatePanel} variant={isCreatePanelOpen ? "outline" : "default"}>
                <Plus className="size-4" />
                {isCreatePanelOpen ? "Fechar" : `Novo ${createLabel}`}
              </Button>
            ) : null}
          </div>
        }
        toolbar={
          <SegmentedControl
            ariaLabel="Seção de gestão do curso"
            value={activeSection}
            onChange={setActiveSection}
            options={sections.map((section) => ({ value: section.value, label: section.label }))}
          />
        }
      >
        {!isFirebaseReady ? (
          <DashboardNotice>Firebase não configurado. As alterações persistentes estão indisponíveis.</DashboardNotice>
        ) : null}

        {activeSection === "overview" ? <CourseOverview /> : null}
        {activeSection === "modules" ? (
          <TrackManagement
            showCreatePanel={showCreateTrackPanel}
            onRequestOpenCreatePanel={() => setShowCreateTrackPanel(true)}
          />
        ) : null}
        {activeSection === "materials" ? (
          <MaterialManagement showCreatePanel={showCreateMaterialPanel} />
        ) : null}
        {activeSection === "activities" ? (
          <ActivityManagement showCreatePanel={showCreateActivityPanel} />
        ) : null}
      </DashboardPage>
    </CourseManagementProvider>
  )
}
