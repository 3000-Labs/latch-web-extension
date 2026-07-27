/**
 * Soroswap /quote returns Aquarius pool indexes as 64-char hex, but /quote/build
 * (and the aggregator DexDistribution parser) expect Base64-encoded BytesN<32>.
 * See soroswap/frontend `poolHashesToScVal`.
 */
export function normalizePoolHashForBuild(hash: string): string {
  const trimmed = hash.trim()
  if (!trimmed) {
    throw new Error('Invalid poolHashes string: empty')
  }

  if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
    return Buffer.from(trimmed, 'hex').toString('base64')
  }

  // Already Base64 (or StrKey) — ensure it decodes to 32 bytes when Base64.
  if (!/^[A-Za-z0-9+/]+=*$/.test(trimmed)) {
    return trimmed
  }
  const buf = Buffer.from(trimmed, 'base64')
  if (buf.length !== 32) {
    throw new Error(`Invalid poolHashes string: ${trimmed}`)
  }
  return trimmed
}

type DistributionLike = {
  poolHashes?: unknown
  [key: string]: unknown
}

type RawTradeLike = {
  distribution?: DistributionLike[]
  [key: string]: unknown
}

/**
 * Deep-clone a Soroswap quote and normalize aqua `poolHashes` for /quote/build.
 * Leaves non-aqua distributions and already-valid hashes untouched.
 */
export function normalizeSoroswapQuoteForBuild(
  quote: Record<string, unknown>
): Record<string, unknown> {
  const cloned = structuredClone(quote) as {
    rawTrade?: RawTradeLike
    [key: string]: unknown
  }

  const distribution = cloned.rawTrade?.distribution
  if (!Array.isArray(distribution)) return cloned

  for (const entry of distribution) {
    if (!entry || typeof entry !== 'object') continue
    const hashes = entry.poolHashes
    if (!Array.isArray(hashes)) continue
    entry.poolHashes = hashes.map((h) => {
      if (typeof h !== 'string') {
        throw new Error(`Invalid poolHashes string: ${String(h)}`)
      }
      return normalizePoolHashForBuild(h)
    })
  }

  return cloned
}
