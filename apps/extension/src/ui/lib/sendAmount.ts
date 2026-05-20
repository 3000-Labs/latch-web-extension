export function formatUsdAmount(n: number): string {
  const floored = Math.floor(n * 100) / 100
  return floored.toFixed(2)
}

export function cryptoToFiat(cryptoAmount: string, priceUsd: number | null | undefined): string | null {
  if (priceUsd == null) return null
  const n = parseFloat(cryptoAmount)
  if (!Number.isFinite(n) || n < 0) return null
  return formatUsdAmount(n * priceUsd)
}

export function fiatToCrypto(fiatAmount: string, priceUsd: number | null | undefined): string | null {
  if (priceUsd == null || priceUsd <= 0) return null
  const n = parseFloat(fiatAmount.replace(/^\$/, ''))
  if (!Number.isFinite(n) || n < 0) return null
  const crypto = n / priceUsd
  return crypto.toFixed(7).replace(/\.?0+$/, '') || '0'
}

export function parsePositiveAmount(value: string): number | null {
  const n = parseFloat(value.replace(/^\$/, '').trim())
  if (!Number.isFinite(n) || n <= 0) return null
  return n
}

/** Returns false when fractional digits exceed `decimals` (Stellar asset precision). */
export function hasValidDecimalPlaces(amount: string, decimals: number | undefined): boolean {
  if (decimals == null || !Number.isFinite(decimals) || decimals < 0) return true
  const normalized = amount.replace(/^\$/, '').trim()
  if (!normalized) return true
  const dot = normalized.indexOf('.')
  if (dot === -1) return true
  const fractional = normalized.slice(dot + 1)
  return fractional.length <= decimals
}

export function isAmountWithinBalance(amount: string, balance: string): boolean {
  const a = parsePositiveAmount(amount)
  const b = parseFloat(balance)
  if (a == null || !Number.isFinite(b)) return false
  return a <= b + 1e-12
}

export function formatSendAmountDisplay(amount: string, inputMode: 'crypto' | 'fiat'): string {
  if (!amount) return inputMode === 'fiat' ? '$0' : '0'
  if (inputMode === 'fiat') {
    return amount.startsWith('$') ? amount : `$${amount}`
  }
  return amount
}
