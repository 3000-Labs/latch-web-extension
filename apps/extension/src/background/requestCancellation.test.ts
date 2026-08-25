/**
 * Tests for per-view request cancellation via AbortController.
 *
 * Covers:
 * - CANCEL_REQUEST aborts an in-flight background request
 * - Late (superseded) responses are not applied after cancellation
 * - registerRequestAbortController supersedes an existing controller
 * - client.ts distinguishes timeout vs explicit cancellation
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Import the registry helpers directly — they have no side-effects.
import {
  registerRequestAbortController,
  requestAbortControllers,
  unregisterRequestAbortController,
} from './requestRegistry'

describe('requestAbortControllers registry', () => {
  beforeEach(() => {
    requestAbortControllers.clear()
  })

  it('registerRequestAbortController creates a new controller', () => {
    const ctrl = registerRequestAbortController('req-1')
    expect(ctrl).toBeInstanceOf(AbortController)
    expect(ctrl.signal.aborted).toBe(false)
    expect(requestAbortControllers.has('req-1')).toBe(true)
  })

  it('registerRequestAbortController aborts the previous controller for the same id (supersede)', () => {
    const first = registerRequestAbortController('req-1')
    const second = registerRequestAbortController('req-1')
    expect(first.signal.aborted).toBe(true)
    expect(second.signal.aborted).toBe(false)
    expect(requestAbortControllers.get('req-1')).toBe(second)
  })

  it('unregisterRequestAbortController removes the entry', () => {
    registerRequestAbortController('req-2')
    expect(requestAbortControllers.has('req-2')).toBe(true)
    unregisterRequestAbortController('req-2')
    expect(requestAbortControllers.has('req-2')).toBe(false)
  })

  it('separate requestIds have independent controllers', () => {
    const a = registerRequestAbortController('req-a')
    const b = registerRequestAbortController('req-b')
    expect(a).not.toBe(b)
    expect(a.signal.aborted).toBe(false)
    expect(b.signal.aborted).toBe(false)
  })
})

describe('CANCEL_REQUEST message handler', () => {
  beforeEach(() => {
    requestAbortControllers.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('aborts and removes the controller for the given requestId', async () => {
    // vi.resetModules ensures a fresh listener is registered.
    // We also re-import the registry to get the same Map instance that the
    // freshly-loaded background/index.ts will use.
    vi.resetModules()
    const [, registry] = await Promise.all([import('./index'), import('./requestRegistry')])

    // Register using the same registry instance the background handler uses.
    const ctrl = registry.registerRequestAbortController('req-cancel-test')
    expect(ctrl.signal.aborted).toBe(false)

    const res = await chrome.runtime.sendMessage({
      type: 'CANCEL_REQUEST',
      payload: { requestId: 'req-cancel-test' },
    })

    expect(res.ok).toBe(true)
    expect(ctrl.signal.aborted).toBe(true)
    expect(registry.requestAbortControllers.has('req-cancel-test')).toBe(false)
  })

  it('is a no-op for unknown requestIds', async () => {
    vi.resetModules()
    await import('./index')

    const res = await chrome.runtime.sendMessage({
      type: 'CANCEL_REQUEST',
      payload: { requestId: 'does-not-exist' },
    })

    expect(res.ok).toBe(true)
  })
})

describe('GET_SMART_ACCOUNT_BALANCES with requestId', () => {
  beforeEach(() => {
    requestAbortControllers.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.resetModules()
  })

  it('registers and unregisters the controller around the fetch', async () => {
    vi.resetModules()
    vi.doMock('./smartAccountBalances', () => ({
      runGetSmartAccountBalances: vi.fn(async (_id: string, _signal?: AbortSignal) => ({
        rows: [],
        totalBalanceUsd: '0',
      })),
      clearSmartAccountBalancesMemoryCache: vi.fn(),
    }))

    await import('./index')

    await chrome.runtime.sendMessage({
      type: 'GET_SMART_ACCOUNT_BALANCES',
      payload: { accountId: 'acc-1', requestId: 'bal-req-1' },
    })

    // After the fetch completes the controller must be cleaned up.
    expect(requestAbortControllers.has('bal-req-1')).toBe(false)
  })
})

describe('client.ts AbortSignal merging', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('maps external signal abort to code=cancelled', async () => {
    vi.resetModules()
    const { latchFetchAbsolute } = await import('./api/client')

    const externalController = new AbortController()

    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string, init?: RequestInit) => {
        return new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            const e = new Error('Aborted')
            ;(e as any).name = 'AbortError'
            reject(e)
          })
        })
      })
    )

    const p = latchFetchAbsolute('https://example.com/api/test', {
      timeoutMs: 30_000,
      signal: externalController.signal,
    })

    externalController.abort()

    await expect(p).rejects.toMatchObject({
      name: 'BackendError',
      code: 'cancelled',
    })
  })

  it('maps internal timeout to code=timeout when only the internal timer fires', async () => {
    vi.useFakeTimers()
    vi.resetModules()
    const { latchFetchAbsolute } = await import('./api/client')

    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string, init?: RequestInit) => {
        return new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            const e = new Error('Aborted')
            ;(e as any).name = 'AbortError'
            reject(e)
          })
        })
      })
    )

    const p = latchFetchAbsolute('https://example.com/api/test', { timeoutMs: 500 })
    const asserted = expect(p).rejects.toMatchObject({
      name: 'BackendError',
      code: 'timeout',
    })

    await vi.advanceTimersByTimeAsync(600)
    await asserted
  })
})
