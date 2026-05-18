export type AssetListItem = {
  code: string
  issuer: string
  contract?: string
  icon: string
}

const LISTS: Record<'mainnet' | 'testnet', string[]> = {
  mainnet: [
    'https://api.stellar.expert/explorer/public/asset-list/top50',
    'https://raw.githubusercontent.com/soroswap/token-list/main/tokenList.json',
    'https://lobstr.co/api/v1/sep/assets/curated.json',
  ],
  testnet: ['https://api.stellar.expert/explorer/testnet/asset-list/top50'],
}

let cachedLists: { network: 'mainnet' | 'testnet'; at: number; data: AssetListItem[] } | null = null
const LIST_TTL_MS = 10 * 60 * 1000

function normalizeAssetEntry(raw: unknown): AssetListItem | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const code = typeof o.code === 'string' ? o.code.trim() : ''
  const issuer = typeof o.issuer === 'string' ? o.issuer.trim() : ''
  const icon = typeof o.icon === 'string' ? o.icon.trim() : ''
  const contract =
    typeof o.contract === 'string'
      ? o.contract.trim()
      : typeof o.contract_id === 'string'
        ? o.contract_id.trim()
        : undefined
  if (!code || !icon || !icon.startsWith('http')) return null
  return { code, issuer: issuer || '', contract, icon }
}

/** Parse SEP-0042 lists, Soroswap, Lobstr, and similar shapes. */
export function normalizeListJson(json: unknown): AssetListItem[] {
  if (!json || typeof json !== 'object') return []
  const root = json as Record<string, unknown>

  const candidates: unknown[] = []
  if (Array.isArray(root.assets)) candidates.push(...root.assets)
  if (Array.isArray(root.tokens)) candidates.push(...root.tokens)
  if (Array.isArray(json)) candidates.push(...(json as unknown[]))

  const out: AssetListItem[] = []
  const seen = new Set<string>()
  for (const raw of candidates) {
    const item = normalizeAssetEntry(raw)
    if (!item) continue
    const key = `${item.code}:${item.issuer}:${item.contract ?? ''}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(item)
  }
  return out
}

export async function fetchCombinedTokenLists(network: 'mainnet' | 'testnet'): Promise<AssetListItem[]> {
  if (cachedLists && cachedLists.network === network && Date.now() - cachedLists.at < LIST_TTL_MS) {
    return cachedLists.data
  }
  const urls = LISTS[network]
  const results = await Promise.all(
    urls.map(async (url) => {
      try {
        const res = await fetch(url, { headers: { Accept: 'application/json' } })
        if (!res.ok) return []
        return normalizeListJson(await res.json())
      } catch {
        return []
      }
    }),
  )
  const merged = results.flat()
  cachedLists = { network, at: Date.now(), data: merged }
  return merged
}

export function iconFromTokenLists(
  lists: AssetListItem[],
  params: { code: string; issuer?: string; sacContractId?: string },
): string | null {
  const code = params.code.toUpperCase()

  if (params.sacContractId) {
    for (const item of lists) {
      if (!item.icon || !item.contract) continue
      if (item.contract === params.sacContractId) return item.icon
    }
  }

  if (params.issuer) {
    for (const item of lists) {
      if (item.code.toUpperCase() !== code || !item.icon) continue
      if (item.issuer === params.issuer) return item.icon
    }
  }

  const byCode = lists.filter((item) => item.code.toUpperCase() === code && item.icon)
  if (byCode.length === 1) return byCode[0]!.icon
  if (byCode.length > 1) {
    const withContract = params.sacContractId
      ? byCode.find((item) => item.contract === params.sacContractId)
      : undefined
    if (withContract?.icon) return withContract.icon
    return byCode[0]!.icon
  }

  return null
}

export const NATIVE_XLM_ICON_URL = 'https://stellar.org/img/stellar-logo.svg'
