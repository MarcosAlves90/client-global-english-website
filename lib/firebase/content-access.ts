type UserVisibleContent = {
  visibility?: "module" | "users" | "private"
  userIds?: string[]
  releaseAt?: Date | string | null
}

export function isContentAvailableToUser(
  content: UserVisibleContent,
  userId: string,
  now: Date
) {
  const visibility = content.visibility ?? "module"
  if (visibility === "private") {
    return false
  }
  if (visibility === "users" && !content.userIds?.includes(userId)) {
    return false
  }
  if (!content.releaseAt) {
    return true
  }

  const releaseAt =
    content.releaseAt instanceof Date
      ? content.releaseAt
      : new Date(content.releaseAt)
  return releaseAt <= now
}
