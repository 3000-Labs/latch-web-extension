import { AQUARIUS_CONFIG } from '../constants'
import type { SwapNetwork } from '../types'
import {
  buildSwapProviderTokenRegistry,
  entriesFromAquariusPools,
  type SwapProviderTokenRegistry,
} from '../swapTokenRegistry'

type AquariusPoolsPage = {
  next?: string | null
  results?: Array<{ tokens_addresses?: string[]; tokens_str?: string[] }>
}

const REGISTRY_TTL_MS = 5 * 60_000
const FETCH_TIMEOUT_MS = 15_000

const memoryCache = new Map<
  SwapNetwork,
  { at: number; registry: SwapProviderTokenRegistry }
>()

let inflight: Promise<SwapProviderTokenRegistry> | null = null

async function fetchAquariusPoolsPage(url: string): Promise<AquariusPoolsPage> {
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `Aquarius pools request failed (${res.status})`)
  }
  return (await res.json()) as AquariusPoolsPage
}

export async function fetchAquariusSwapRegistry(
  network: SwapNetwork,
  options?: { forceRefresh?: boolean }
): Promise<SwapProviderTokenRegistry> {
  if (network !== 'testnet') {
    throw new Error('Aquarius swap registry is only used on testnet')
  }

  const cached = memoryCache.get(network)
  if (!options?.forceRefresh && cached && Date.now() - cached.at < REGISTRY_TTL_MS) {
    return cached.registry
  }

  if (inflight) return inflight

  inflight = (async () => {
    const config = AQUARIUS_CONFIG[network]
    const pools: Array<{ tokens_addresses?: string[]; tokens_str?: string[] }> = []
    let nextUrl: string | null = `${config.apiBase}/pools/?page_size=100`

    while (nextUrl) {
      const page = await fetchAquariusPoolsPage(nextUrl)
      pools.push(...(page.results ?? []))
      nextUrl = page.next ?? null
    }

    const registry = buildSwapProviderTokenRegistry(entriesFromAquariusPools(pools))
    memoryCache.set(network, { at: Date.now(), registry })
    return registry
  })().finally(() => {
    inflight = null
  })

  return inflight
}

export function resetAquariusSwapRegistryCacheForTests(): void {
  memoryCache.clear()
  inflight = null
}
