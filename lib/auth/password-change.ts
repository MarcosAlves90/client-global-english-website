import { validatePassword } from "@/lib/auth/validators"

export type PasswordChangeValidation =
  | { ok: true }
  | { ok: false; message: string }

export function validatePasswordChange(
  password: string,
  confirmation: string
): PasswordChangeValidation {
  const passwordError = validatePassword(password)
  if (passwordError) {
    return { ok: false, message: passwordError }
  }

  if (password !== confirmation) {
    return { ok: false, message: "A confirmação da senha não corresponde." }
  }

  return { ok: true }
}
