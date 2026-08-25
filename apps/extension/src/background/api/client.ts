import type { SerializableError } from '@latch/types'

import { latchApiBaseUrl } from './config'
import { parseApiError } from './errors'

export class BackendError extends Error {
  public readonly status?: number
  public readonly code?: string
  public readonly details?: unknown

  constructor(message: string, opts?: { status?: number; code?: string; details?: unknown }) {
    super(message)
    this.name = 'BackendError'
    this.status = opts?.status
    this.code = opts?.code
    this.details = opts?.details
  }

  toSerializable(): SerializableError {
    return { message: this.message, status: this.status, code: this.code }
  }
}

async function parseJsonResponse(
  res: Response,
  baseUrl: string,
  pathOrUrl: string
): Promise<unknown> {
  const text = await res.text()
  if (!text) return undefined

  const trimmed = text.trimStart()
  if (trimmed.startsWith('<')) {
    throw new BackendError(
      `API returned HTML instead of JSON (${res.status}). Check PLASMO_PUBLIC_LATCH_API_URL (${baseUrl}) and that ${pathOrUrl} exists on your Latch API.`,
      { status: res.status }
    )
  }

  try {
    return JSON.parse(text) as unknown
  } catch {
    throw new BackendError(
      `API response was not valid JSON (${res.status}). Check PLASMO_PUBLIC_LATCH_API_URL (${baseUrl}) and route ${pathOrUrl}.`,
      { status: res.status }
    )
  }
}

function throwIfNotOk(res: Response, data: unknown): void {
  if (res.ok) return
  const { message, code } = parseApiError(res.status, data)
  throw new BackendError(message, {
    status: res.status,
    code,
    details: data,
  })
}

export async function latchFetch<TRes>(
  path: string,
  init?: RequestInit & { timeoutMs?: number; signal?: AbortSignal }
): Promise<TRes> {
  const baseUrl = latchApiBaseUrl()
  return latchFetchAbsolute<TRes>(`${baseUrl}${path}`, init)
}

export async function latchFetchAbsoluteWithResponse<TRes>(
  url: string,
  init?: RequestInit & { timeoutMs?: number; signal?: AbortSignal }
): Promise<{ res: Response; data: TRes }> {
  const timeoutController = new AbortController()
  const timeoutMs = init?.timeoutMs ?? 20_000
  const timeout = setTimeout(() => timeoutController.abort(), timeoutMs)
  const baseUrl = latchApiBaseUrl()

  // Merge the caller's external signal with our timeout signal so either can
  // abort the fetch. AbortSignal.any() is available in Chrome 116+ (MV3 target).
  const signal =
    init?.signal
      ? AbortSignal.any([init.signal, timeoutController.signal])
      : timeoutController.signal

  try {
    const res = await fetch(url, {
      ...init,
      credentials: init?.credentials ?? 'include',
      signal,
      headers: {
        'content-type': 'application/json',
        ...(init?.headers ?? {}),
      },
    })

    const data = (await parseJsonResponse(res, baseUrl, url)) as TRes
    throwIfNotOk(res, data)
    return { res, data }
  } catch (err) {
    if (err instanceof BackendError) throw err
    if (err instanceof Error && err.name === 'AbortError') {
      // Distinguish between a timeout and an explicit cancellation.
      const cancelledByExternal = init?.signal?.aborted
      if (cancelledByExternal) {
        throw new BackendError('Request cancelled', { code: 'cancelled' })
      }
      throw new BackendError('Request timed out', { code: 'timeout' })
    }
    throw new BackendError(err instanceof Error ? err.message : String(err))
  } finally {
    clearTimeout(timeout)
  }
}

export async function latchFetchAbsolute<TRes>(
  url: string,
  init?: RequestInit & { timeoutMs?: number; signal?: AbortSignal }
): Promise<TRes> {
  const { data } = await latchFetchAbsoluteWithResponse<TRes>(url, init)
  return data
}
