/** Per-view AbortController registry keyed by UI-issued requestId. Side-effect-free for tests. */

const controllers = new Map<string, AbortController>()
const pendingAbortIds = new Set<string>()

/** Register a request; returns a signal aborted if CANCEL_REQUEST arrived first. */
export function registerRequest(requestId: string): AbortSignal {
  const ctrl = new AbortController()
  controllers.set(requestId, ctrl)
  if (pendingAbortIds.delete(requestId)) {
    ctrl.abort()
  }
  return ctrl.signal
}

/** Abort a registered request, or mark pending if register has not run yet. */
export function abortRequest(requestId: string): boolean {
  const ctrl = controllers.get(requestId)
  if (ctrl) {
    ctrl.abort()
    return true
  }
  pendingAbortIds.add(requestId)
  return false
}

export function unregisterRequest(requestId: string): void {
  controllers.delete(requestId)
  pendingAbortIds.delete(requestId)
}

/** Test helper — reset module state between cases. */
export function clearRequestRegistry(): void {
  for (const ctrl of controllers.values()) {
    ctrl.abort()
  }
  controllers.clear()
  pendingAbortIds.clear()
}
