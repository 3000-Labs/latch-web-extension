import type { SerializableError } from '@latch/types'

/** True when the response belongs to the still-active UI request. */
export function isCurrentRequest(currentId: string | null, responseId: string): boolean {
  return currentId !== null && currentId === responseId
}

/** Whether a background response should update UI state for the active request. */
export function shouldApplyBackgroundResult(args: {
  currentId: string | null
  responseId: string
  error?: SerializableError
}): boolean {
  if (!isCurrentRequest(args.currentId, args.responseId)) return false
  if (args.error?.code === 'cancelled') return false
  return true
}

export function createRequestId(): string {
  return crypto.randomUUID()
}
