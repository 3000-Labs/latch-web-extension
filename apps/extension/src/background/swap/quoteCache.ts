const QUOTE_DEDUPE_TTL_MS = 15_000

type CacheEntry<T> = {
  promise: Promise<T>
  expiresAtMs: number
}

const inflight = new Map<string, CacheEntry<unknown>>()

export function quoteCacheKey(parts: Record<string, string | number>): string {
  return Object.entries(parts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('|')
}

export function getOrCreateQuote<T>(key: string, factory: () => Promise<T>): Promise<T> {
  const now = Date.now()
  const existing = inflight.get(key) as CacheEntry<T> | undefined
  if (existing && existing.expiresAtMs > now) {
    return existing.promise
  }
  const promise = factory().finally(() => {
    const entry = inflight.get(key)
    if (entry?.promise === promise) {
      setTimeout(() => {
        const current = inflight.get(key)
        if (current?.promise === promise) inflight.delete(key)
      }, QUOTE_DEDUPE_TTL_MS)
    }
  })
  inflight.set(key, { promise, expiresAtMs: now + QUOTE_DEDUPE_TTL_MS })
  return promise
}

export function clearQuoteCache(): void {
  inflight.clear()
}
