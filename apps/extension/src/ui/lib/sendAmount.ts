/** Mirrors background tokenPrices interim map for UI conversion. */
const TOKEN_USD_PRICES: Record<string, number> = {
  XLM: 0.16,
  USDC: 1.0,
  USDT: 1.0,
}

export function getUsdPriceForAsset(code: string): number | null {
  return TOKEN_USD_PRICES[code.toUpperCase()] ?? null
}

export function formatUsdAmount(n: number): string {
  const floored = Math.floor(n * 100) / 100
  return floored.toFixed(2)
}

export function cryptoToFiat(cryptoAmount: string, code: string): string | null {
  const price = getUsdPriceForAsset(code)
  if (price == null) return null
  const n = parseFloat(cryptoAmount)
  if (!Number.isFinite(n) || n < 0) return null
  return formatUsdAmount(n * price)
}

export function fiatToCrypto(fiatAmount: string, code: string): string | null {
  const price = getUsdPriceForAsset(code)
  if (price == null || price <= 0) return null
  const n = parseFloat(fiatAmount.replace(/^\$/, ''))
  if (!Number.isFinite(n) || n < 0) return null
  const crypto = n / price
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
