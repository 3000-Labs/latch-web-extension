import { Asset } from '@stellar/stellar-sdk'

export type SwapProviderTokenEntry = {
  contractId: string
  symbol: string
  issuer?: string
  assetId: string
  label: string
}

export type SwapProviderTokenRegistry = {
  byContractId: Map<string, SwapProviderTokenEntry>
  byAssetKey: Map<string, SwapProviderTokenEntry>
}

export function swapAssetKeyFromParts(
  code: string,
  issuer?: string,
  assetId?: string
): string {
  if (issuer) return `${code}:${issuer}`
  return assetId ?? (code.toUpperCase() === 'XLM' ? 'native' : code)
}

export function buildSwapProviderTokenRegistry(
  entries: SwapProviderTokenEntry[]
): SwapProviderTokenRegistry {
  const byContractId = new Map<string, SwapProviderTokenEntry>()
  const byAssetKey = new Map<string, SwapProviderTokenEntry>()

  for (const entry of entries) {
    byContractId.set(entry.contractId, entry)
    byAssetKey.set(swapAssetKeyFromParts(entry.symbol, entry.issuer, entry.assetId), entry)
  }

  return { byContractId, byAssetKey }
}

export function parseAquariusPoolTokenLabel(label: string): {
  symbol: string
  issuer?: string
  assetId: string
} {
  const trimmed = label.trim()
  if (trimmed === 'native') {
    return { symbol: 'XLM', assetId: 'native' }
  }

  const colon = trimmed.indexOf(':')
  if (colon > 0) {
    const symbol = trimmed.slice(0, colon).trim()
    const issuer = trimmed.slice(colon + 1).trim()
    if (issuer.startsWith('G')) {
      return { symbol, issuer, assetId: symbol }
    }
  }

  return { symbol: trimmed, assetId: trimmed }
}

export function entriesFromAquariusPools(
  pools: Array<{ tokens_addresses?: string[]; tokens_str?: string[] }>
): SwapProviderTokenEntry[] {
  const byContractId = new Map<string, SwapProviderTokenEntry>()

  for (const pool of pools) {
    const addresses = pool.tokens_addresses ?? []
    const labels = pool.tokens_str ?? []
    for (let i = 0; i < addresses.length; i += 1) {
      const contractId = addresses[i]?.trim()
      if (!contractId) continue
      const label = labels[i]?.trim() ?? contractId
      const parsed = parseAquariusPoolTokenLabel(label)
      byContractId.set(contractId, {
        contractId,
        symbol: parsed.symbol,
        issuer: parsed.issuer,
        assetId: parsed.assetId,
        label,
      })
    }
  }

  return [...byContractId.values()]
}

export type TokenListContractSource = {
  code: string
  issuer?: string
  contract?: string
  name?: string
  decimals?: number
}

export function entriesFromTokenList(
  items: TokenListContractSource[],
  networkPassphrase: string
): SwapProviderTokenEntry[] {
  const byContractId = new Map<string, SwapProviderTokenEntry>()

  const nativeContractId = Asset.native().contractId(networkPassphrase)
  byContractId.set(nativeContractId, {
    contractId: nativeContractId,
    symbol: 'XLM',
    assetId: 'native',
    label: 'native',
  })

  for (const item of items) {
    if (!item.code) continue
    const isNative = item.code.toUpperCase() === 'XLM' && !item.issuer
    const contractId = resolveTokenListContractId(item, networkPassphrase)
    if (!contractId) continue

    const parsed = isNative
      ? { symbol: 'XLM', assetId: 'native' as const }
      : { symbol: item.code, issuer: item.issuer, assetId: item.code }

    byContractId.set(contractId, {
      contractId,
      symbol: parsed.symbol,
      issuer: parsed.issuer,
      assetId: parsed.assetId,
      label: isNative ? 'native' : item.issuer ? `${item.code}:${item.issuer}` : item.code,
    })
  }

  return [...byContractId.values()]
}

export function resolveTokenListContractId(
  item: TokenListContractSource,
  networkPassphrase: string
): string | null {
  if (!item.code) return null
  if (item.code.toUpperCase() === 'XLM' && !item.issuer) {
    return Asset.native().contractId(networkPassphrase)
  }
  if (item.contract?.trim()) return item.contract.trim()
  if (item.issuer) {
    try {
      return new Asset(item.code, item.issuer).contractId(networkPassphrase)
    } catch {
      return null
    }
  }
  return null
}

export function applyRegistryContractId<T extends { id: string; contractId: string }>(
  token: T,
  registry: SwapProviderTokenRegistry
): T {
  const entry = registry.byAssetKey.get(token.id)
  if (!entry || entry.contractId === token.contractId) return token
  return { ...token, contractId: entry.contractId }
}

export function isTokenInSwapRegistry(
  token: { id: string; contractId: string },
  registry: SwapProviderTokenRegistry
): boolean {
  const entry = registry.byAssetKey.get(token.id)
  if (!entry) return false
  return entry.contractId === token.contractId
}
