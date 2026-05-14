export type SwapTokenVm = {
  id: string
  symbol: string
  name: string
  /** Optional data URL from background (portfolio / icon resolver). */
  iconUrl?: string | null
}

export type SwapDraft = {
  payTokenId: string
  receiveTokenId: string
  payAmount: string
  useExchangeBalance: boolean
  /** UI-only: when true, show the “approved” expanded details view. */
  approved: boolean
}

export type SwapQuoteVm = {
  provider: string
  rateLine: string
  slippageLine: string
  minReceivedLine: string
  networkFeeLine: string
  receiveAmountLine: string
  receiveUsdApproxLine: string
}

export const swapTokens: SwapTokenVm[] = [
  { id: "usdt", symbol: "USDT", name: "Tether" },
  { id: "xlm", symbol: "XLM", name: "Stellar" }
]

export function truncateAddress(addr: string, left = 6, right = 4) {
  if (addr.length <= left + right + 3) return addr
  return `${addr.slice(0, left)}...${addr.slice(-right)}`
}

export function toPositiveNumberOrNull(text: string): number | null {
  const cleaned = text.replace(/[^\d.]/g, "")
  if (cleaned.length === 0) return null
  const n = Number(cleaned)
  if (!Number.isFinite(n) || n <= 0) return null
  return n
}

export function formatCompactAmount(n: number, decimals = 2) {
  if (!Number.isFinite(n)) return "--"
  if (n === 0) return "0"
  const abs = Math.abs(n)
  if (abs < 1) return n.toFixed(Math.min(6, Math.max(2, decimals + 2)))
  if (abs < 1000) return n.toFixed(decimals)
  if (abs < 1_000_000) return `${(n / 1000).toFixed(2)}K`
  return `${(n / 1_000_000).toFixed(2)}M`
}

export function formatUsdApprox(amountUsd: number) {
  if (!Number.isFinite(amountUsd)) return "≈ --"
  return `≈ $${amountUsd.toFixed(2)}`
}

export function mockQuote(draft: SwapDraft, payToken: SwapTokenVm, receiveToken: SwapTokenVm): SwapQuoteVm {
  const pay = toPositiveNumberOrNull(draft.payAmount) ?? 0

  // UI-only deterministic mock values (small “edge” so it looks realistic).
  const slippagePct = 0.5
  const feeXlm = 0.00001
  const receive = pay === 0 ? 0 : pay * 0.00084221
  const minReceived = receive * (1 - slippagePct / 100)

  const receiveUsd = pay === 0 ? NaN : pay * 1.00306

  return {
    provider: "LiquidMesh",
    rateLine: `1 ${payToken.symbol} > 0.00084221 ${receiveToken.symbol}`,
    slippageLine: `Auto | ${slippagePct}%`,
    minReceivedLine: `${minReceived.toFixed(6)} ${receiveToken.symbol}`,
    networkFeeLine: `~ ${feeXlm.toFixed(5)} Stellar`,
    receiveAmountLine: pay === 0 ? "--" : `+${receive.toFixed(8)} ${receiveToken.symbol}`,
    receiveUsdApproxLine: pay === 0 ? "" : `≈ $${receiveUsd.toFixed(5)} (+0.25%)`
  }
}

