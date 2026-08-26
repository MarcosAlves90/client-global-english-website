"use client"

import * as React from "react"

import { DashboardEmptyState, DashboardNotice } from "@/components/dashboard/dashboard-feedback"
import { DashboardPage } from "@/components/dashboard/dashboard-page"
import { SearchField } from "@/components/dashboard/search-field"
import { SegmentedControl } from "@/components/dashboard/segmented-control"
import { useAuth } from "@/hooks/use-auth"
import { toFriendlyFirestoreLoadError } from "@/lib/firebase/error-message"
import { fetchUserDashboard } from "@/lib/firebase/firestore"
import type { DashboardCourse } from "@/lib/firebase/types"
import { StudentCourseCard } from "@/modules/courses/ui/student-course-card"
import { BookOpen } from "lucide-react"

type CourseFilter = "active" | "completed" | "all"

export default function Page() {
  const { isFirebaseReady, user } = useAuth()
  const [courses, setCourses] = React.useState<DashboardCourse[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [query, setQuery] = React.useState("")
  const [filter, setFilter] = React.useState<CourseFilter>("active")

  React.useEffect(() => {
    async function load() {
      if (!isFirebaseReady || !user) { setCourses([]); return }
      try { setLoading(true); setError(null); setCourses(await fetchUserDashboard(user.uid)) }
      catch (loadError) { setError(toFriendlyFirestoreLoadError(loadError, "Não foi possível carregar seus cursos.")) }
      finally { setLoading(false) }
    }
    void load()
  }, [isFirebaseReady, user])

  const filtered = courses.filter((course) => {
    const matchesQuery = `${course.title} ${course.description} ${course.level}`.toLocaleLowerCase("pt-BR").includes(query.trim().toLocaleLowerCase("pt-BR"))
    const matchesFilter = filter === "all" || (filter === "completed" ? course.enrollment.status === "completed" : course.enrollment.status !== "completed")
    return matchesQuery && matchesFilter
  })

  return (
    <DashboardPage
      title="Cursos"
      description="Encontre um curso e continue diretamente do conteúdo que está estudando."
      toolbar={<><SearchField value={query} onChange={setQuery} placeholder="Buscar cursos..." className="relative min-w-0 flex-1 sm:max-w-sm" /><SegmentedControl value={filter} onChange={setFilter} options={[{ value: "active", label: "Em andamento" }, { value: "completed", label: "Concluídos" }, { value: "all", label: "Todos" }]} ariaLabel="Filtrar cursos" /></>}
    >
      {!isFirebaseReady ? <DashboardNotice>Firebase não configurado. Conecte para visualizar seus cursos.</DashboardNotice> : null}
      {error ? <DashboardNotice tone="danger">{error}</DashboardNotice> : null}
      {loading ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{[0,1,2].map((item) => <div key={item} className="h-80 animate-pulse rounded-2xl bg-muted" />)}</div> : filtered.length === 0 ? <DashboardEmptyState icon={BookOpen} title={query ? "Nenhum curso encontrado" : "Nenhum curso nesta categoria"} description={query ? "Tente buscar por outro nome, nível ou palavra-chave." : "Quando houver cursos disponíveis, eles aparecerão aqui."} /> : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{filtered.map((course) => <StudentCourseCard key={course.id} course={course} />)}</div>}
    </DashboardPage>
  )
}
