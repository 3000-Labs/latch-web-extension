import { normalizeStellarContractId } from '@latch/swap'

export type TokenListItem = {
  code: string
  issuer: string
  contract?: string
  icon: string
  name?: string
  decimals?: number
}

/** @deprecated use TokenListItem */
export type AssetListItem = TokenListItem

/** Keyed by symbol (e.g. "USDC") or "SYMBOL:ISSUER". First occurrence wins per key. */
export type TokenMap = Record<string, TokenListItem>

const LISTS: Record<'mainnet' | 'testnet', string[]> = {
  mainnet: [
    'https://api.stellar.expert/explorer/public/asset-list/top50',
    'https://lobstr.co/api/v1/sep/assets/curated.json',
    'https://raw.githubusercontent.com/soroswap/token-list/main/tokenList.json',
  ],
  testnet: [
    'https://api.stellar.expert/explorer/testnet/asset-list/top50',
    'https://lobstr.co/api/v1/sep/assets/curated.json',
    'https://raw.githubusercontent.com/soroswap/token-list/main/tokenList.json',
  ],
}

/** v2: contract ids normalized to C-address (Lobstr lists previously stored hex). */
const STORAGE_KEY_PREFIX = 'latch.tokenListMap.v2'
const LIST_STALE_MS = 24 * 60 * 60 * 1000
const FETCH_TIMEOUT_MS = 10_000

let memoryCache: { network: 'mainnet' | 'testnet'; at: number; map: TokenMap } | null = null

export function clearTokenListMemoryCache(): void {
  memoryCache = null
}

function storageKey(network: 'mainnet' | 'testnet'): string {
  return `${STORAGE_KEY_PREFIX}:${network}`
}

function normalizeAssetEntry(raw: unknown): TokenListItem | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const code = typeof o.code === 'string' ? o.code.trim() : ''
  const issuer = typeof o.issuer === 'string' ? o.issuer.trim() : ''
  const icon = typeof o.icon === 'string' ? o.icon.trim() : ''
  const rawContract =
    typeof o.contract === 'string'
      ? o.contract.trim()
      : typeof o.contract_id === 'string'
        ? o.contract_id.trim()
        : undefined
  // Lobstr curated lists ship 32-byte hex; normalize to C-address for SAC APIs.
  const contract = rawContract
    ? (normalizeStellarContractId(rawContract) ?? undefined)
    : undefined
  const name = typeof o.name === 'string' ? o.name.trim() : undefined
  const decimalsRaw = o.decimals
  const decimals =
    typeof decimalsRaw === 'number' && Number.isFinite(decimalsRaw) && decimalsRaw >= 0
      ? decimalsRaw
      : undefined
  if (!code || !icon || !icon.startsWith('http')) return null
  return { code, issuer: issuer || '', contract, icon, name, decimals }
}

/** Parse SEP-0042 lists, Soroswap, Lobstr, and similar shapes. */
export function normalizeListJson(json: unknown): TokenListItem[] {
  if (!json || typeof json !== 'object') return []
  const root = json as Record<string, unknown>

  const candidates: unknown[] = []
  if (Array.isArray(root.assets)) candidates.push(...root.assets)
  if (Array.isArray(root.tokens)) candidates.push(...root.tokens)
  if (Array.isArray(json)) candidates.push(...(json as unknown[]))

  const out: TokenListItem[] = []
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

export function buildTokenMap(items: TokenListItem[]): TokenMap {
  const map: TokenMap = {}
  for (const t of items) {
    if (!t.code || !t.icon) continue
    const codeKey = t.code.toUpperCase()
    const fullKey = `${codeKey}:${t.issuer ?? ''}`
    if (!map[fullKey]) map[fullKey] = t
    if (!map[codeKey]) map[codeKey] = t
  }
  return map
}

export function iconFromTokenMap(
  map: TokenMap,
  params: { code: string; issuer?: string; sacContractId?: string }
): string | null {
  const code = params.code.toUpperCase()

  if (code === 'XLM' && !params.issuer) {
    return null
  }

  if (params.sacContractId) {
    for (const item of Object.values(map)) {
      if (!item.icon || !item.contract) continue
      if (item.contract === params.sacContractId) return item.icon
    }
  }

  if (params.issuer) {
    const fullKey = `${code}:${params.issuer}`
    const hit = map[fullKey]
    if (hit?.icon) return hit.icon
  }

  const byCode = map[code]
  if (byCode?.icon) return byCode.icon

  return null
}

/** @deprecated use iconFromTokenMap with fetchTokenMap */
export function iconFromTokenLists(
  lists: TokenListItem[],
  params: { code: string; issuer?: string; sacContractId?: string }
): string | null {
  return iconFromTokenMap(buildTokenMap(lists), params)
}

export function listJsonMatchesNetwork(
  json: unknown,
  network: 'mainnet' | 'testnet'
): boolean {
  if (!json || typeof json !== 'object') return true
  const declared = (json as Record<string, unknown>).network
  if (typeof declared !== 'string') return true
  const n = declared.toLowerCase()
  if (n === 'public' || n === 'mainnet') return network === 'mainnet'
  if (n === 'testnet') return network === 'testnet'
  return true
}

async function fetchListUrl(
  url: string,
  network: 'mainnet' | 'testnet'
): Promise<TokenListItem[]> {
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    })
    if (!res.ok) return []
    const json = await res.json()
    if (!listJsonMatchesNetwork(json, network)) return []
    return normalizeListJson(json)
  } catch {
    return []
  }
}

async function readPersistedMap(network: 'mainnet' | 'testnet'): Promise<TokenMap | null> {
  const key = storageKey(network)
  const r = await chrome.storage.local.get(key)
  const raw = r[key]
  if (!raw || typeof raw !== 'object') return null
  const o = raw as { fetchedAt?: number; map?: TokenMap }
  if (typeof o.fetchedAt !== 'number' || Date.now() - o.fetchedAt >= LIST_STALE_MS) return null
  if (!o.map || typeof o.map !== 'object') return null
  return o.map
}

async function persistMap(network: 'mainnet' | 'testnet', map: TokenMap): Promise<void> {
  await chrome.storage.local.set({
    [storageKey(network)]: { fetchedAt: Date.now(), map },
  })
}

async function fetchTokenListFromNetwork(network: 'mainnet' | 'testnet'): Promise<TokenMap> {
  const urls = LISTS[network]
  const settled = await Promise.allSettled(urls.map((url) => fetchListUrl(url, network)))

  const combined: TokenListItem[] = []
  for (const result of settled) {
    if (result.status === 'fulfilled') {
      combined.push(...result.value)
    }
  }

  return buildTokenMap(combined)
}

export async function fetchTokenMap(network: 'mainnet' | 'testnet'): Promise<TokenMap> {
  if (
    memoryCache &&
    memoryCache.network === network &&
    Date.now() - memoryCache.at < LIST_STALE_MS
  ) {
    return memoryCache.map
  }

  const persisted = await readPersistedMap(network)
  if (persisted) {
    memoryCache = { network, at: Date.now(), map: persisted }
    return persisted
  }

  const map = await fetchTokenListFromNetwork(network)
  memoryCache = { network, at: Date.now(), map }
  await persistMap(network, map)
  return map
}

/** @deprecated use fetchTokenMap */
export async function fetchCombinedTokenLists(
  network: 'mainnet' | 'testnet'
): Promise<TokenListItem[]> {
  const map = await fetchTokenMap(network)
  const items: TokenListItem[] = []
  const seen = new Set<string>()
  for (const item of Object.values(map)) {
    const key = `${item.code}:${item.issuer}:${item.contract ?? ''}`
    if (seen.has(key)) continue
    seen.add(key)
    items.push(item)
  }
  return items
}

export function coinCapIconUrl(code: string): string {
  return `https://assets.coincap.io/assets/icons/${code.toLowerCase()}@2x.png`
}
