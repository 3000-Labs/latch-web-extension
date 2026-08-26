import { toSerializableError } from './messageResponse'

type LogStructuredErrorOptions = {
  dedupeKey?: string
  metadata?: Record<string, unknown>
}

const ERROR_LOG_DEDUPE_WINDOW_MS = 30_000
const recentErrorLogs = new Map<string, number>()

export function logStructuredError(
  scope: string,
  error: unknown,
  options: LogStructuredErrorOptions = {}
): void {
  const normalized = toSerializableError(error)
  const dedupeKey = options.dedupeKey ?? `${scope}:${normalized.code ?? ''}:${normalized.message}`
  const now = Date.now()
  const lastLoggedAt = recentErrorLogs.get(dedupeKey)
  if (lastLoggedAt !== undefined && now - lastLoggedAt < ERROR_LOG_DEDUPE_WINDOW_MS) return
  recentErrorLogs.set(dedupeKey, now)

  console.error(`[latch:${scope}]`, {
    error: normalized,
    ...options.metadata,
  })
}