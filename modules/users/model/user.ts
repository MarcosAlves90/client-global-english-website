import type { UserRole } from "@/lib/firebase/types"

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  teacher: "Professor",
  user: "Aluno",
}
