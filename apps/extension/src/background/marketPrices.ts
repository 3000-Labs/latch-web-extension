import { BackendError } from './backend'
import { latchMarketApiBaseUrl } from './marketEnv'

type PricesResponse = {
  data?: Record<string, { price: string; change_24h: number }>
  error?: { code?: string; message?: string }
}

export type TokenPriceUsd = { priceUsd: number; change24h: number }

type Snapshot = {
  updatedAtMs: number
  pricesByCodeUpper: Record<string, TokenPriceUsd>
}

const STORAGE_KEY_SNAPSHOT = 'latch.marketPrices.snapshot.v1'

const FETCH_TIMEOUT_MS = 10_000
const FRESH_TTL_MS = 60_000
const MAX_STALE_MS = 10 * 60_000

let memoryCache: Snapshot | null = null
let inflight: Map<string, Promise<Snapshot>> = new Map()

function normalizeCodes(tokens: string[]): string[] {
  const uniq = new Set<string>()
  for (const t of tokens) {
    if (typeof t !== 'string') continue
    const trimmed = t.trim()
    if (!trimmed) continue
    uniq.add(trimmed.toLowerCase())
  }
  return Array.from(uniq.values()).sort()
}

function cacheFreshEnough(s: Snapshot, now: number): boolean {
  return now - s.updatedAtMs < FRESH_TTL_MS
}

function cacheUsableAsStaleFallback(s: Snapshot, now: number): boolean {
  return now - s.updatedAtMs < MAX_STALE_MS
}

async function readPersistedSnapshot(): Promise<Snapshot | null> {
  try {
    const r = await chrome.storage.local.get([STORAGE_KEY_SNAPSHOT])
    const raw = r[STORAGE_KEY_SNAPSHOT]
    if (!raw || typeof raw !== 'object') return null
    const s = raw as Partial<Snapshot>
    if (typeof s.updatedAtMs !== 'number' || !s.pricesByCodeUpper) return null
    if (typeof s.pricesByCodeUpper !== 'object') return null
    return { updatedAtMs: s.updatedAtMs, pricesByCodeUpper: s.pricesByCodeUpper as any }
  } catch {
    return null
  }
}

async function writePersistedSnapshot(snapshot: Snapshot): Promise<void> {
  try {
    await chrome.storage.local.set({
      [STORAGE_KEY_SNAPSHOT]: snapshot,
    })
  } catch {
    // ignore best-effort persistence
  }
}

function mergePrices(base: Snapshot | null, add: Snapshot): Snapshot {
  const merged: Snapshot = {
    updatedAtMs: Math.max(base?.updatedAtMs ?? 0, add.updatedAtMs),
    pricesByCodeUpper: { ...(base?.pricesByCodeUpper ?? {}), ...add.pricesByCodeUpper },
  }
  return merged
}

async function fetchJsonWithTimeout(url: string): Promise<PricesResponse> {
  const controller = new AbortController()
  const t = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(url, { method: 'GET', signal: controller.signal })
    const text = await res.text()
    let data: unknown = undefined
    if (text) {
      try {
        data = JSON.parse(text) as unknown
      } catch {
        throw new BackendError(`Market API response was not valid JSON (${res.status}).`, {
          status: res.status,
          code: 'invalid_json',
        })
      }
    }
    const body = data as PricesResponse
    if (!res.ok) {
      const message =
        body?.error?.message ??
        (typeof (body as any)?.message === 'string' ? (body as any).message : undefined) ??
        `Request failed: ${res.status}`
      throw new BackendError(message, {
        status: res.status,
        code: body?.error?.code ?? (body as any)?.code,
        details: body,
      })
    }
    return body
  } catch (err) {
    if (err instanceof BackendError) throw err
    if (err instanceof Error && err.name === 'AbortError') {
      throw new BackendError('Request timed out', { code: 'timeout' })
    }
    throw new BackendError(err instanceof Error ? err.message : String(err))
  } finally {
    clearTimeout(t)
  }
}

async function fetchPricesSnapshot(tokensLower: string[]): Promise<Snapshot> {
  const base = latchMarketApiBaseUrl()
  const q = encodeURIComponent(tokensLower.join(','))
  const url = `${base}/prices?tokens=${q}`
  const body = await fetchJsonWithTimeout(url)

  const pricesByCodeUpper: Record<string, TokenPriceUsd> = {}
  for (const [code, v] of Object.entries(body.data ?? {})) {
    const upper = code.toUpperCase()
    const priceUsd = parseFloat(v.price)
    const change24h = typeof v.change_24h === 'number' ? v.change_24h : Number(v.change_24h)
    if (!Number.isFinite(priceUsd)) continue
    pricesByCodeUpper[upper] = {
      priceUsd,
      change24h: Number.isFinite(change24h) ? change24h : 0,
    }
  }

  const snapshot: Snapshot = {
    updatedAtMs: Date.now(),
    pricesByCodeUpper,
  }
  return snapshot
}

/**
 * Returns a map from UPPERCASE token code → price info, or null when no usable cached value exists.
 * Uses an in-memory TTL cache, a persisted snapshot for warm start, and in-flight de-dupe per token set.
 */
export async function getMarketPrices(tokens: string[]): Promise<{
  updatedAtMs: number | null
  pricesByCodeUpper: Record<string, TokenPriceUsd>
}> {
  const now = Date.now()

  if (!memoryCache) {
    const persisted = await readPersistedSnapshot()
    if (persisted) memoryCache = persisted
  }

  const tokensLower = normalizeCodes(tokens)
  if (tokensLower.length === 0) {
    return { updatedAtMs: memoryCache?.updatedAtMs ?? null, pricesByCodeUpper: {} }
  }

  // If cache is fresh and contains all requested tokens, return immediately.
  if (memoryCache && cacheFreshEnough(memoryCache, now)) {
    let ok = true
    for (const t of tokensLower) {
      const upper = t.toUpperCase()
      if (!memoryCache.pricesByCodeUpper[upper]) {
        ok = false
        break
      }
    }
    if (ok) {
      return { updatedAtMs: memoryCache.updatedAtMs, pricesByCodeUpper: memoryCache.pricesByCodeUpper }
    }
  }

  const key = tokensLower.join(',')
  const existing = inflight.get(key)
  if (existing) {
    const s = await existing
    memoryCache = mergePrices(memoryCache, s)
    return { updatedAtMs: memoryCache.updatedAtMs, pricesByCodeUpper: memoryCache.pricesByCodeUpper }
  }

  const p = fetchPricesSnapshot(tokensLower)
    .then(async (snapshot) => {
      memoryCache = mergePrices(memoryCache, snapshot)
      await writePersistedSnapshot(memoryCache)
      return snapshot
    })
    .finally(() => {
      inflight.delete(key)
    })

  inflight.set(key, p)

  try {
    await p
  } catch (err) {
    // Network failure: use stale fallback if within window; otherwise return empty map and let UI show '—'.
    if (memoryCache && cacheUsableAsStaleFallback(memoryCache, now)) {
      return { updatedAtMs: memoryCache.updatedAtMs, pricesByCodeUpper: memoryCache.pricesByCodeUpper }
    }
    throw err
  }

  const s = memoryCache
  return { updatedAtMs: s?.updatedAtMs ?? null, pricesByCodeUpper: s?.pricesByCodeUpper ?? {} }
}

