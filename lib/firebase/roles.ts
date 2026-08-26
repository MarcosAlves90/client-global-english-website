import type { UserRole } from "@/lib/firebase/types"

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean)

export function resolveUserRole(params: {
  email?: string | null
  existingRole?: UserRole | null
}): UserRole {
  if (params.existingRole === "admin") {
    return "admin"
  }

  if (params.email) {
    const normalizedEmail = params.email.trim().toLowerCase()
    if (ADMIN_EMAILS.includes(normalizedEmail)) {
      return "admin"
    }
  }

  if (params.existingRole === "teacher") {
    return "teacher"
  }

  return "user"
}
