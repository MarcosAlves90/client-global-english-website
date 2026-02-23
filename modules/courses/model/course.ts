export const COURSE_STATUS_OPTIONS = [
  "Inscrições abertas",
  "Em andamento",
  "Finalizado",
  "Pausado",
  "Arquivado",
] as const

export type CourseStatus = (typeof COURSE_STATUS_OPTIONS)[number]

export const STATUS_STYLES: Record<CourseStatus, string> = {
  "Inscrições abertas":
    "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800/50",
  "Em andamento":
    "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800/50",
  Finalizado:
    "bg-zinc-200 text-zinc-700 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
  Pausado:
    "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800/50",
  Arquivado:
    "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800/50",
}
