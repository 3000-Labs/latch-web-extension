const nf2 = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatDisplay2dp(value: number): string {
  if (!Number.isFinite(value)) return '—'
  return nf2.format(value)
}

export function formatDisplayAmount2dp(amount: string): string {
  const n = parseFloat(amount)
  if (!Number.isFinite(n)) return amount
  return formatDisplay2dp(n)
}

