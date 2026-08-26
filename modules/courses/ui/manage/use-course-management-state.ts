import * as React from "react"

import { useAuth } from "@/hooks/use-auth"
import { fetchAdminCourses } from "@/modules/courses"
import { fetchAdminCourseTracks } from "@/modules/tracks"
import { fetchAdminCourseMaterials } from "@/modules/materials"
import { fetchAdminCourseActivities, fetchAdminActivityProgress } from "@/modules/activities"
import { fetchAdminUsersPage } from "@/modules/users"
import type {
  AdminActivityResponse,
  AdminCourseSummary,
  AdminUserSummary,
  Activity,
  Material,
  Track,
} from "@/lib/firebase/types"

type CourseManagementStateArgs = {
  courseId: string
}

export function useCourseManagementState({ courseId }: CourseManagementStateArgs) {
  const { user, isFirebaseReady } = useAuth()

  const [course, setCourse] = React.useState<AdminCourseSummary | null>(null)
  const [tracks, setTracks] = React.useState<Track[]>([])
  const [materials, setMaterials] = React.useState<Material[]>([])
  const [activities, setActivities] = React.useState<Activity[]>([])
  const [activityResponses, setActivityResponses] = React.useState<AdminActivityResponse[]>([])
  const [availableUsers, setAvailableUsers] = React.useState<AdminUserSummary[]>([])

  const [loading, setLoading] = React.useState({
    course: false,
    tracks: false,
    materials: false,
    activities: false,
    responses: false,
    users: false,
  })

  const [errors, setErrors] = React.useState<{
    global: string | null
    track: string | null
    material: string | null
    activity: string | null
    user: string | null
  }>({
    global: null,
    track: null,
    material: null,
    activity: null,
    user: null,
  })

  const loadCourse = React.useCallback(async () => {
    if (!courseId || !user) return
    try {
      setLoading((prev) => ({ ...prev, course: true }))
      const idToken = await user.getIdToken()
      const data = await fetchAdminCourses(idToken)
      const match = data.find((item) => item.id === courseId) ?? null
      setCourse(match)
    } catch {
      setErrors((prev) => ({ ...prev, global: "Erro ao carregar curso" }))
    } finally {
      setLoading((prev) => ({ ...prev, course: false }))
    }
  }, [courseId, user])

  const loadTracks = React.useCallback(async (force?: boolean) => {
    if (!courseId || !user) return
    try {
      setLoading((prev) => ({ ...prev, tracks: true }))
      const idToken = await user.getIdToken()
      const data = await fetchAdminCourseTracks(idToken, courseId, { force })
      setTracks(data)
    } catch {
      setErrors((prev) => ({ ...prev, track: "Erro ao carregar módulos" }))
    } finally {
      setLoading((prev) => ({ ...prev, tracks: false }))
    }
  }, [courseId, user])

  const loadMaterials = React.useCallback(async (force?: boolean) => {
    if (!courseId || !user) return
    try {
      setLoading((prev) => ({ ...prev, materials: true }))
      const idToken = await user.getIdToken()
      const data = await fetchAdminCourseMaterials(idToken, courseId, { force })
      setMaterials(data)
    } catch {
      setErrors((prev) => ({ ...prev, material: "Erro ao carregar materiais" }))
    } finally {
      setLoading((prev) => ({ ...prev, materials: false }))
    }
  }, [courseId, user])

  const loadActivities = React.useCallback(async (force?: boolean) => {
    if (!courseId || !user) return
    try {
      setLoading((prev) => ({ ...prev, activities: true }))
      const idToken = await user.getIdToken()
      const data = await fetchAdminCourseActivities(idToken, courseId, { force })
      setActivities(data)
    } catch {
      setErrors((prev) => ({ ...prev, activity: "Erro ao carregar atividades" }))
    } finally {
      setLoading((prev) => ({ ...prev, activities: false }))
    }
  }, [courseId, user])

  const loadActivityResponses = React.useCallback(async (force?: boolean) => {
    if (!courseId || !user) return
    try {
      setLoading((prev) => ({ ...prev, responses: true }))
      const idToken = await user.getIdToken()
      const data = await fetchAdminActivityProgress({
        idToken,
        courseId,
        force,
      })
      setActivityResponses(data)
    } catch {
      setErrors((prev) => ({ ...prev, activity: "Erro ao carregar respostas das atividades" }))
    } finally {
      setLoading((prev) => ({ ...prev, responses: false }))
    }
  }, [courseId, user])

  const loadUsers = React.useCallback(async () => {
    if (!user) return
    try {
      setLoading((prev) => ({ ...prev, users: true }))
      const idToken = await user.getIdToken()
      const data = await fetchAdminUsersPage({ idToken, pageSize: 100, cursor: null })
      setAvailableUsers(data.items)
    } catch {
      setErrors((prev) => ({ ...prev, user: "Erro ao carregar usuários" }))
    } finally {
      setLoading((prev) => ({ ...prev, users: false }))
    }
  }, [user])

  React.useEffect(() => {
    if (isFirebaseReady && user) {
      void loadCourse()
      void loadTracks()
      void loadMaterials()
      void loadActivities()
      void loadActivityResponses()
      void loadUsers()
    }
  }, [isFirebaseReady, user, loadCourse, loadTracks, loadMaterials, loadActivities, loadActivityResponses, loadUsers])

  return {
    courseId,
    course,
    tracks,
    materials,
    activities,
    activityResponses,
    availableUsers,
    loading,
    errors,
    loadTracks,
    loadMaterials,
    loadActivities,
    loadActivityResponses,
    user,
  }
}
