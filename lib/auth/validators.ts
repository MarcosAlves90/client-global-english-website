export function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

export function validateName(name: string): string | null {
  const value = name.trim()
  if (!value) {
    return "Nome é obrigatório."
  }

  if (value.length < 3) {
    return "Nome precisa ter pelo menos 3 caracteres."
  }

  return null
}

export function validateEmail(email: string): string | null {
  const value = normalizeEmail(email)
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!value) {
    return "Email é obrigatório."
  }

  if (!emailPattern.test(value)) {
    return "Informe um email válido."
  }

  return null
}

export function validatePassword(password: string): string | null {
  if (!password) {
    return "Senha é obrigatória."
  }

  if (password.length < 8) {
    return "A senha precisa ter pelo menos 8 caracteres."
  }

  const hasUpper = /[A-Z]/.test(password)
  const hasLower = /[a-z]/.test(password)
  const hasNumber = /\d/.test(password)

  if (!hasUpper || !hasLower || !hasNumber) {
    return "A senha deve conter letra maiúscula, minúscula e número."
  }

  return null
}
