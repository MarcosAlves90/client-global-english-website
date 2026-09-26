export type ActivityTitle = Readonly<{ title: string }>

export function compareActivityTitles(left: ActivityTitle, right: ActivityTitle) {
  return left.title.localeCompare(right.title, "pt-BR", { sensitivity: "base" })
}

export function sortActivitiesAlphabetically<T extends ActivityTitle>(activities: readonly T[]) {
  return [...activities].sort(compareActivityTitles)
}
