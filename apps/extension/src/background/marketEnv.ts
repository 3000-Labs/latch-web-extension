const DEFAULT_LATCH_MARKET_API_URL = 'https://latch-backend.onrender.com/v1'

/** Plasmo inlines `process.env.PLASMO_PUBLIC_*` at build time; keep a direct `process.env` reference. */
export function latchMarketApiBaseUrl(): string {
  const raw = process.env.PLASMO_PUBLIC_LATCH_MARKET_API_URL as string | undefined
  const s =
    typeof raw === 'string' && raw.trim() !== '' ? raw.trim() : DEFAULT_LATCH_MARKET_API_URL
  return s.replace(/\/$/, '')
}

