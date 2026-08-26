export type SupportTicketDraft = {
  subject: string
  message: string
}

export type SupportTicketDraftValidation =
  | { ok: true; value: SupportTicketDraft }
  | { ok: false; message: string }

export function validateSupportTicketDraft(
  draft: SupportTicketDraft
): SupportTicketDraftValidation {
  const subject = draft.subject.trim()
  const message = draft.message.trim()

  if (subject.length < 4) {
    return { ok: false, message: "Informe um assunto com pelo menos 4 caracteres." }
  }

  if (message.length < 10) {
    return { ok: false, message: "Descreva a solicitação com pelo menos 10 caracteres." }
  }

  if (subject.length > 120 || message.length > 4000) {
    return { ok: false, message: "A solicitação excede o tamanho permitido." }
  }

  return { ok: true, value: { subject, message } }
}
