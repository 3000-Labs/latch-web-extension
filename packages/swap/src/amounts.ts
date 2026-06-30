/** Convert human-readable decimal amount to smallest-unit integer string. */
export function humanToRaw(amount: string, decimals: number): string {
  const cleaned = amount.replace(/,/g, '').trim()
  if (!/^\d*\.?\d+$/.test(cleaned) || cleaned === '' || cleaned === '.') {
    throw new Error('Invalid amount')
  }
  const [whole = '0', frac = ''] = cleaned.split('.')
  const fracPadded = frac.padEnd(decimals, '0').slice(0, decimals)
  const raw = `${whole}${fracPadded}`.replace(/^0+/, '') || '0'
  if (!/^\d+$/.test(raw)) throw new Error('Invalid amount')
  return raw
}

/** Convert smallest-unit integer string to human-readable decimal (no trailing zeros). */
export function rawToHuman(raw: string, decimals: number): string {
  const n = raw.replace(/^0+/, '') || '0'
  if (decimals === 0) return n
  const padded = n.padStart(decimals + 1, '0')
  const whole = padded.slice(0, -decimals) || '0'
  const frac = padded.slice(-decimals).replace(/0+$/, '')
  return frac.length > 0 ? `${whole}.${frac}` : whole
}

export function rawToNumber(raw: string, decimals: number): number {
  return Number.parseFloat(rawToHuman(raw, decimals))
}

/** Apply slippage tolerance: floor(amountOut * (1 - slippageBps/10000)). */
export function applySlippageMin(amountOutRaw: string, slippageBps: number): string {
  const amount = BigInt(amountOutRaw)
  const numerator = BigInt(10_000 - Math.min(Math.max(slippageBps, 0), 9_999))
  const min = (amount * numerator) / 10_000n
  return min.toString()
}

export const DEFAULT_SLIPPAGE_BPS = 50

/** Quote validity window shown in UI; refreshed automatically before confirm when stale. */
export const QUOTE_TTL_MS = 120_000
