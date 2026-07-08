import { fetchMarketPricesNormalized } from './api/market'

export type TokenPriceUsd = { priceUsd: number; change24h: number }

type Snapshot = {
  updatedAtMs: number
  pricesByCodeUpper: Record<string, TokenPriceUsd>
}

const STORAGE_KEY_SNAPSHOT = 'latch.marketPrices.snapshot.v1'

const FRESH_TTL_MS = 60_000
const MAX_STALE_MS = 10 * 60_000

let memoryCache: Snapshot | null = null
const inflight: Map<string, Promise<Snapshot>> = new Map()

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

async function fetchPricesSnapshot(tokensLower: string[]): Promise<Snapshot> {
  const pricesByCodeUpper = await fetchMarketPricesNormalized(tokensLower)
  return {
    updatedAtMs: Date.now(),
    pricesByCodeUpper,
  }
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
