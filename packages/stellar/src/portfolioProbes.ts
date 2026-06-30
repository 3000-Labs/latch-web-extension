import type { PortfolioTokenProbe } from './smartAccountPortfolio'

export const MAX_PORTFOLIO_PROBES = 50

export function mergePortfolioProbes(
  lists: PortfolioTokenProbe[][],
  max = MAX_PORTFOLIO_PROBES
): PortfolioTokenProbe[] {
  const out: PortfolioTokenProbe[] = []
  const seen = new Set<string>()

  for (const list of lists) {
    for (const p of list) {
      if (seen.has(p.sacContractId)) continue
      seen.add(p.sacContractId)
      out.push(p)
      if (out.length >= max) break
    }
    if (out.length >= max) break
  }

  const xlmIndex = out.findIndex((p) => p.code.toUpperCase() === 'XLM' && !p.issuer)
  if (xlmIndex > 0) {
    const [xlm] = out.splice(xlmIndex, 1)
    out.unshift(xlm!)
  }

  return out
}
