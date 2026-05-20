function formatUsdFloor(n: number): string {
  const floored = Math.floor(n * 100) / 100
  return floored.toFixed(2)
}

export function computeBalanceUsd(amount: string, priceUsd: number | null | undefined): string | null {
  if (priceUsd == null) return null
  const n = parseFloat(amount)
  if (!Number.isFinite(n)) return null
  return formatUsdFloor(n * priceUsd)
}

export function computeTotalBalanceUsd(
  rows: { amount: string; code: string }[],
  pricesByCodeUpper: Record<string, number | undefined>
): string | null {
  let sum = 0
  let any = false
  for (const row of rows) {
    const priceUsd = pricesByCodeUpper[row.code.toUpperCase()]
    if (priceUsd == null) continue
    const n = parseFloat(row.amount)
    if (!Number.isFinite(n)) continue
    sum += n * priceUsd
    any = true
  }
  return any ? formatUsdFloor(sum) : null
}

export function formatUsdDisplay(usd: string | null): string {
  if (usd == null) return '—'
  return `$${usd}`
}
