import type { AdminActivityResponse } from "@/lib/firebase/types"

export type ReviewStatusFilter = "pending" | "revision_requested" | "graded"
export type SubmissionDateFilter = "all" | "7d" | "30d"
export type SubmissionSort = "newest" | "oldest" | "student" | "activity"

export type SubmissionFilterOptions = {
  status: ReviewStatusFilter
  searchQuery: string
  activityId: string
  dateRange: SubmissionDateFilter
  sort: SubmissionSort
}

export type SubmissionPage<T> = {
  items: T[]
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
  from: number
  to: number
}

function parseSubmissionDate(value: Date | string | null) {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function matchesReviewStatus(item: AdminActivityResponse, status: ReviewStatusFilter) {
  if (status === "revision_requested") {
    return item.gradingStatus === "revision_requested"
  }
  if (status === "graded") {
    return item.gradingStatus === "graded"
  }
  return item.status === "completed" && item.gradingStatus === "pending"
}

function searchableValues(item: AdminActivityResponse) {
  return [item.activity?.title, item.user?.name, item.user?.email]
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.toLocaleLowerCase("pt-BR"))
}

function compareText(a: string | undefined, b: string | undefined) {
  return (a ?? "").localeCompare(b ?? "", "pt-BR", { sensitivity: "base" })
}

export function filterTeacherSubmissions(
  submissions: AdminActivityResponse[],
  options: SubmissionFilterOptions,
  now = new Date()
) {
  const query = options.searchQuery.trim().toLocaleLowerCase("pt-BR")
  const cutoffDays = options.dateRange === "7d" ? 7 : options.dateRange === "30d" ? 30 : null
  const cutoff = cutoffDays === null
    ? null
    : new Date(now.getTime() - cutoffDays * 24 * 60 * 60 * 1000)

  const filtered = submissions.filter((item) => {
    if (!matchesReviewStatus(item, options.status)) return false
    if (options.activityId !== "all" && item.activity?.id !== options.activityId) return false
    if (query && !searchableValues(item).some((value) => value.includes(query))) return false

    if (cutoff) {
      const submittedAt = parseSubmissionDate(item.submittedAt)
      if (!submittedAt || submittedAt < cutoff) return false
    }

    return true
  })

  return [...filtered].sort((a, b) => {
    if (options.sort === "student") {
      return compareText(a.user?.name ?? a.user?.email, b.user?.name ?? b.user?.email)
    }
    if (options.sort === "activity") {
      return compareText(a.activity?.title, b.activity?.title)
    }

    const aTime = parseSubmissionDate(a.submittedAt)?.getTime() ?? 0
    const bTime = parseSubmissionDate(b.submittedAt)?.getTime() ?? 0
    return options.sort === "oldest" ? aTime - bTime : bTime - aTime
  })
}

export function paginateTeacherSubmissions<T>(
  items: T[],
  requestedPage: number,
  requestedPageSize: number
): SubmissionPage<T> {
  const pageSize = Number.isFinite(requestedPageSize)
    ? Math.min(Math.max(Math.floor(requestedPageSize), 1), 100)
    : 10
  const totalItems = items.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const page = Math.min(Math.max(Math.floor(requestedPage) || 1, 1), totalPages)
  const start = (page - 1) * pageSize
  const pageItems = items.slice(start, start + pageSize)

  return {
    items: pageItems,
    page,
    pageSize,
    totalItems,
    totalPages,
    from: totalItems === 0 ? 0 : start + 1,
    to: totalItems === 0 ? 0 : start + pageItems.length,
  }
}
