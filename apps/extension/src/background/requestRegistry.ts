/**
 * Per-request AbortController registry for background fetch cancellation.
 *
 * Extracted into its own module so it can be imported by handler modules and
 * tests without pulling in the side-effecting background/index.ts barrel.
 *
 * ## Pattern
 *
 * 1. UI sends a message with `requestId` (e.g. GET_SMART_ACCOUNT_BALANCES).
 * 2. The background handler calls `registerRequestAbortController(requestId)`,
 *    obtains the AbortSignal, and passes it down to the fetch/RPC call.
 * 3. When the request finishes (success or error) the handler calls
 *    `unregisterRequestAbortController(requestId)`.
 * 4. If the view unmounts or a new request supersedes the old one, the UI sends
 *    `CANCEL_REQUEST { requestId }`. The background/index.ts listener aborts and
 *    removes the controller.
 * 5. Handlers check `signal.aborted` before calling `sendResponse` and swallow
 *    the error when the signal is already aborted, so the UI never gets a stale
 *    response.
 *
 * Keys are the caller-supplied `requestId` strings. Entries are deleted as soon
 * as the request completes or is cancelled so the map stays small.
 */

export const requestAbortControllers = new Map<string, AbortController>()

/**
 * Create and register a new AbortController for `requestId`.
 * If a controller already exists for that id it is aborted first (supersede).
 */
export function registerRequestAbortController(requestId: string): AbortController {
  const existing = requestAbortControllers.get(requestId)
  if (existing) existing.abort()
  const controller = new AbortController()
  requestAbortControllers.set(requestId, controller)
  return controller
}

/** Remove the controller from the registry (called on completion or cancel). */
export function unregisterRequestAbortController(requestId: string): void {
  requestAbortControllers.delete(requestId)
}
