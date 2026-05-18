/** Interim hardcoded USD — swap implementation when Latch API POST /api/token-prices exists. */
const TOKEN_USD_PRICES: Record<string, number> = {
  XLM: 0.16,
  USDC: 1.0,
  USDT: 1.0,
}

export function getUsdPriceForAsset(code: string): number | null {
  return TOKEN_USD_PRICES[code.toUpperCase()] ?? null
}

function formatUsdFloor(n: number): string {
  const floored = Math.floor(n * 100) / 100
  return floored.toFixed(2)
}

export function computeBalanceUsd(amount: string, code: string): string | null {
  const price = getUsdPriceForAsset(code)
  if (price == null) return null
  const n = parseFloat(amount)
  if (!Number.isFinite(n)) return null
  return formatUsdFloor(n * price)
}

export function computeTotalBalanceUsd(rows: { amount: string; code: string }[]): string | null {
  let sum = 0
  let any = false
  for (const row of rows) {
    const price = getUsdPriceForAsset(row.code)
    if (price == null) continue
    const n = parseFloat(row.amount)
    if (!Number.isFinite(n)) continue
    sum += n * price
    any = true
  }
  return any ? formatUsdFloor(sum) : null
}

export function formatUsdDisplay(usd: string | null): string {
  if (usd == null) return '—'
  return `$${usd}`
}
