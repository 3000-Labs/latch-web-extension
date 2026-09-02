import { BackendError } from './api/client'
import { registerRequest, unregisterRequest } from './requestRegistry'

function abortRejectedPromise(signal: AbortSignal): Promise<never> {
  return new Promise((_, reject) => {
    if (signal.aborted) {
      reject(new BackendError('Request cancelled', { code: 'cancelled' }))
      return
    }
    signal.addEventListener(
      'abort',
      () => reject(new BackendError('Request cancelled', { code: 'cancelled' })),
      { once: true }
    )
  })
}

/**
 * Detach this message waiter on CANCEL_REQUEST without aborting shared inflight I/O.
 * When requestId is omitted, runs the factory unchanged (backward compatible).
 */
export async function withCancellableWaiter<T>(
  requestId: string | undefined,
  run: () => Promise<T>
): Promise<T> {
  if (!requestId) return run()

  const signal = registerRequest(requestId)
  try {
    const result = await Promise.race([run(), abortRejectedPromise(signal)])
    if (signal.aborted) {
      throw new BackendError('Request cancelled', { code: 'cancelled' })
    }
    return result
  } finally {
    unregisterRequest(requestId)
  }
}
