import { afterEach, describe, expect, it, vi } from 'vitest'

import { BackendError, latchFetchAbsolute } from './api/client'
import {
  abortRequest,
  clearRequestRegistry,
  registerRequest,
  unregisterRequest,
} from './requestRegistry'
import { withCancellableWaiter } from './requestWaiter'

describe('requestRegistry', () => {
  afterEach(() => {
    clearRequestRegistry()
  })

  it('register returns a live signal', () => {
    const signal = registerRequest('a')
    expect(signal.aborted).toBe(false)
    unregisterRequest('a')
  })

  it('abortRequest aborts a registered signal', () => {
    const signal = registerRequest('a')
    expect(abortRequest('a')).toBe(true)
    expect(signal.aborted).toBe(true)
    unregisterRequest('a')
  })

  it('cancel-before-register yields an already-aborted signal', () => {
    expect(abortRequest('early')).toBe(false)
    const signal = registerRequest('early')
    expect(signal.aborted).toBe(true)
    unregisterRequest('early')
  })

  it('unregisterRequest removes the controller', () => {
    registerRequest('a')
    unregisterRequest('a')
    expect(abortRequest('a')).toBe(false)
  })
})

describe('withCancellableWaiter', () => {
  afterEach(() => {
    clearRequestRegistry()
  })

  it('passes through when requestId is omitted', async () => {
    const result = await withCancellableWaiter(undefined, async () => ({ rows: [] }))
    expect(result).toEqual({ rows: [] })
  })

  it('resolves when the factory completes before cancel', async () => {
    const result = await withCancellableWaiter('req-1', async () => ({ rows: [{ code: 'XLM' }] }))
    expect(result.rows).toHaveLength(1)
  })

  it('throws cancelled when abort wins the race', async () => {
    const requestId = 'req-cancel'
    const p = withCancellableWaiter(requestId, () => new Promise<{ rows: [] }>(() => {}))
    abortRequest(requestId)
    await expect(p).rejects.toMatchObject({
      name: 'BackendError',
      code: 'cancelled',
    } satisfies Partial<BackendError>)
  })

  it('shared inflight continues after waiter cancel', async () => {
    let resolveShared!: (value: { rows: [] }) => void
    const shared = new Promise<{ rows: [] }>((resolve) => {
      resolveShared = resolve
    })
    const runGet = vi.fn(() => shared)

    const pA = withCancellableWaiter('waiter-a', runGet)
    abortRequest('waiter-a')
    await expect(pA).rejects.toMatchObject({ code: 'cancelled' })

    const pB = withCancellableWaiter('waiter-b', runGet)
    resolveShared({ rows: [] })
    await expect(pB).resolves.toEqual({ rows: [] })
    expect(runGet).toHaveBeenCalledTimes(2)
  })
})

describe('latchFetch cancellation vs timeout', () => {
  it('maps caller abort to code=cancelled', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string, init?: RequestInit) => {
        return new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            const e = new Error('Aborted')
            ;(e as Error & { name: string }).name = 'AbortError'
            reject(e)
          })
        })
      })
    )

    const caller = new AbortController()
    const p = latchFetchAbsolute('https://example.com/api/test', { signal: caller.signal })
    caller.abort()
    await expect(p).rejects.toMatchObject({
      name: 'BackendError',
      code: 'cancelled',
    } satisfies Partial<BackendError>)

    vi.unstubAllGlobals()
  })

  it('maps internal timeout to code=timeout', async () => {
    vi.useFakeTimers()

    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string, init?: RequestInit) => {
        return new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            const e = new Error('Aborted')
            ;(e as Error & { name: string }).name = 'AbortError'
            reject(e)
          })
        })
      })
    )

    const p = latchFetchAbsolute('https://example.com/api/test', { timeoutMs: 1000 })
    const asserted = expect(p).rejects.toMatchObject({
      name: 'BackendError',
      code: 'timeout',
    } satisfies Partial<BackendError>)

    await vi.advanceTimersByTimeAsync(1001)
    await asserted

    vi.useRealTimers()
    vi.unstubAllGlobals()
  })
})
