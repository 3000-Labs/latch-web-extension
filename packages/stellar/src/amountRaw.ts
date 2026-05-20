/**
 * Convert Horizon-style human decimal strings to integer smallest-units (stroops / token units)
 * without floating-point loss. Assumes non-negative amounts for migration sweeps.
 */
export function humanAmountStringToRawUnits(human: string, decimals: number): bigint {
  const trimmed = human.trim()
  if (!trimmed || trimmed === '0') return 0n
  const neg = trimmed.startsWith('-')
  const s0 = neg ? trimmed.slice(1) : trimmed
  const [intPartRaw, fracRaw = ''] = s0.split('.')
  const intPart = intPartRaw === '' ? '0' : intPartRaw.replace(/^0+/, '') || '0'
  const fracPadded = (fracRaw + '0'.repeat(decimals)).slice(0, decimals)
  const combined = `${intPart}${fracPadded}`.replace(/^0+/, '') || '0'
  const v = BigInt(combined)
  return neg ? -v : v
}
