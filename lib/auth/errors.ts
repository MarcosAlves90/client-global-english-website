const FIREBASE_AUTH_ERROR_MESSAGES: Record<string, string> = {
  "auth/invalid-email": "Email inválido.",
  "auth/missing-password": "Senha obrigatória.",
  "auth/invalid-credential": "Credenciais inválidas. Verifique email e senha.",
  "auth/wrong-password": "Senha incorreta.",
  "auth/user-not-found": "Usuário não encontrado.",
  "auth/user-disabled": "Conta desativada. Fale com um administrador.",
  "auth/email-already-in-use": "Este email já está em uso.",
  "auth/weak-password": "Senha fraca. Use uma senha mais forte.",
  "auth/too-many-requests": "Muitas tentativas. Aguarde um pouco e tente novamente.",
  "auth/network-request-failed": "Falha de rede. Confira sua conexão.",
}

export function getAuthErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "code" in error) {
    const code = String((error as { code?: string }).code)
    return FIREBASE_AUTH_ERROR_MESSAGES[code] ?? fallback
  }

  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: string }).message
    if (message) {
      return message
    }
  }

  return fallback
}
