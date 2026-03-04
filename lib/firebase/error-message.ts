type FirebaseLikeError = {
  code?: string
  message?: string
}

function normalizeCode(code?: string) {
  if (!code) {
    return ""
  }
  return code.toLowerCase().replace("firestore/", "")
}

export function toFriendlyFirestoreLoadError(
  error: unknown,
  fallbackMessage: string
) {
  const candidate = (error ?? {}) as FirebaseLikeError
  const code = normalizeCode(candidate.code)

  if (code === "failed-precondition") {
    return `${fallbackMessage} (índice do Firestore ainda está sendo criado).`
  }

  if (code === "permission-denied") {
    return `${fallbackMessage} (permissão negada nas regras do Firestore).`
  }

  if (code === "unavailable") {
    return `${fallbackMessage} (serviço indisponível no momento).`
  }

  return fallbackMessage
}
