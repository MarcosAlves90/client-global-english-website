"use client"

import * as React from "react"
import { useParams } from "next/navigation"

import { useCourseManagementActions } from "./use-course-management-actions"
import { useCourseManagementState } from "./use-course-management-state"
import type { CourseManagementProviderChildren } from "./courseManagement.types"

type CourseManagementProviderValue = ReturnType<typeof useCourseManagementState> &
  ReturnType<typeof useCourseManagementActions>

const CourseManagementContext = React.createContext<CourseManagementProviderValue | undefined>(
  undefined
)

export function CourseManagementProvider({ children }: CourseManagementProviderChildren) {
  const params = useParams<{ courseId?: string }>()
  const courseId = (Array.isArray(params?.courseId) ? params.courseId[0] : params?.courseId) || ""

  const state = useCourseManagementState({ courseId })
  const actions = useCourseManagementActions({
    courseId: state.courseId,
    user: state.user,
    loadTracks: state.loadTracks,
    loadMaterials: state.loadMaterials,
    loadActivities: state.loadActivities,
    loadActivityResponses: state.loadActivityResponses,
  })

  const value = React.useMemo(
    () => ({
      courseId: state.courseId,
      course: state.course,
      tracks: state.tracks,
      materials: state.materials,
      activities: state.activities,
      activityResponses: state.activityResponses,
      availableUsers: state.availableUsers,
      user: state.user,
      loading: state.loading,
      errors: state.errors,
      loadTracks: state.loadTracks,
      loadMaterials: state.loadMaterials,
      loadActivities: state.loadActivities,
      loadActivityResponses: state.loadActivityResponses,
      ...actions,
    }),
    [actions, state]
  )

  return <CourseManagementContext.Provider value={value}>{children}</CourseManagementContext.Provider>
}

export function useCourseManagement() {
  const context = React.useContext(CourseManagementContext)
  if (context === undefined) {
    throw new Error("useCourseManagement must be used within a CourseManagementProvider")
  }
  return context
}

export type {
  TrackForm,
  MaterialForm,
  ActivityForm,
} from "./courseManagement.types"
