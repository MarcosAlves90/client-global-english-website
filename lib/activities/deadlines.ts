export type ActivitySchedule = {
  releaseAt?: Date | string | null
  dueAt?: Date | string | null
  closeAt?: Date | string | null
}

export type ActivityScheduleValidation =
  | { ok: true }
  | { ok: false; message: string }

export function parseActivityDate(value: Date | string | null | undefined) {
  if (!value) return null
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value
  }

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}


export function serializeActivityDateInput(
  value: Date | string | null | undefined
) {
  const parsed = parseActivityDate(value)
  return parsed ? parsed.toISOString() : null
}

function hasInvalidDate(value: Date | string | null | undefined) {
  return Boolean(value) && parseActivityDate(value) === null
}

export function validateActivitySchedule(
  schedule: ActivitySchedule
): ActivityScheduleValidation {
  if (hasInvalidDate(schedule.releaseAt)) {
    return { ok: false, message: "A data de liberação é inválida." }
  }
  if (hasInvalidDate(schedule.dueAt)) {
    return { ok: false, message: "A data de entrega é inválida." }
  }
  if (hasInvalidDate(schedule.closeAt)) {
    return { ok: false, message: "A data de encerramento é inválida." }
  }

  const releaseAt = parseActivityDate(schedule.releaseAt)
  const dueAt = parseActivityDate(schedule.dueAt)
  const closeAt = parseActivityDate(schedule.closeAt)

  if (releaseAt && dueAt && dueAt.getTime() < releaseAt.getTime()) {
    return {
      ok: false,
      message: "O prazo de entrega não pode ser anterior à liberação.",
    }
  }

  const minimumCloseAt = dueAt ?? releaseAt
  if (minimumCloseAt && closeAt && closeAt.getTime() < minimumCloseAt.getTime()) {
    return {
      ok: false,
      message: dueAt
        ? "O encerramento não pode ser anterior ao prazo de entrega."
        : "O encerramento não pode ser anterior à liberação.",
    }
  }

  return { ok: true }
}

export function getActivityTiming(
  schedule: ActivitySchedule,
  now: Date = new Date()
) {
  const dueAt = parseActivityDate(schedule.dueAt)
  const closeAt = parseActivityDate(schedule.closeAt)
  const nowTime = now.getTime()

  return {
    dueAt,
    closeAt,
    isOverdue: Boolean(dueAt && nowTime > dueAt.getTime()),
    isClosed: Boolean(closeAt && nowTime > closeAt.getTime()),
  }
}
