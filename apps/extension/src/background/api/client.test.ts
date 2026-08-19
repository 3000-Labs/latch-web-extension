import { describe, expect, it, vi } from 'vitest'

import { BackendError, latchFetchAbsolute } from './client'
import { parseApiError } from './errors'

describe('api/client', () => {
  it('maps non-2xx JSON error into BackendError with status', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        return {
          ok: false,
          status: 500,
          async text() {
            return JSON.stringify({ error: 'boom' })
          },
        } as any
      })
    )

    await expect(latchFetchAbsolute('https://example.com/api/test')).rejects.toMatchObject({
      name: 'BackendError',
      status: 500,
      message: 'boom',
    } satisfies Partial<BackendError>)

    vi.unstubAllGlobals()
  })

  it('maps nested v1 error into BackendError code', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        return {
          ok: false,
          status: 400,
          async text() {
            return JSON.stringify({
              error: { code: 'INVALID_TOKENS', message: 'bad tokens' },
            })
          },
        } as any
      })
    )

    await expect(latchFetchAbsolute('https://example.com/v1/prices')).rejects.toMatchObject({
      name: 'BackendError',
      status: 400,
      code: 'INVALID_TOKENS',
      message: 'bad tokens',
    } satisfies Partial<BackendError>)

    vi.unstubAllGlobals()
  })

  it('maps AbortError into BackendError(code=timeout)', async () => {
    vi.useFakeTimers()

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

describe('parseApiError integration', () => {
  it('extracts NO_CONTEXT_RULE from webapp 409 body', () => {
    const parsed = parseApiError(409, {
      error: 'Context rule required',
      code: 'NO_CONTEXT_RULE',
    })
    expect(parsed.code).toBe('NO_CONTEXT_RULE')
  })
})
