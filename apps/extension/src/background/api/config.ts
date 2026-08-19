export const DEFAULT_LATCH_API_URL = 'https://latch-backend.onrender.com'

/** Plasmo inlines `process.env.PLASMO_PUBLIC_*` at build time; keep a direct `process.env` reference. */
export function latchApiBaseUrl(): string {
  const raw = process.env.PLASMO_PUBLIC_LATCH_API_URL as string | undefined
  const s = typeof raw === 'string' && raw.trim() !== '' ? raw.trim() : DEFAULT_LATCH_API_URL
  return s.replace(/\/$/, '')
}

/** Market API base; defaults to `{latchApiBaseUrl}/v1` when unset. */
export function latchMarketApiBaseUrl(): string {
  const marketRaw = process.env.PLASMO_PUBLIC_LATCH_MARKET_API_URL as string | undefined
  if (typeof marketRaw === 'string' && marketRaw.trim() !== '') {
    return marketRaw.trim().replace(/\/$/, '')
  }
  return `${latchApiBaseUrl()}/v1`
}
