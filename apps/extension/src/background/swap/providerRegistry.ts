import type { SwapNetwork } from '@latch/swap'
import {
  buildSwapProviderTokenRegistry,
  entriesFromTokenList,
  fetchAquariusSwapRegistry,
  type SwapProviderTokenRegistry,
} from '@latch/swap'

import { fetchCombinedTokenLists, type TokenListItem } from '../assetTokenLists'
import { getActiveNetwork, networkPassphraseFor } from '../network/config'

const REGISTRY_TTL_MS = 5 * 60_000

let memoryCache: { network: SwapNetwork; at: number; registry: SwapProviderTokenRegistry } | null =
  null
/** In-flight loads keyed by network so a switch cannot await/poison the other network. */
const inflightByNetwork: Partial<Record<SwapNetwork, Promise<SwapProviderTokenRegistry>>> = {}

function buildMainnetRegistry(items: TokenListItem[]): SwapProviderTokenRegistry {
  // Mainnet passphrase is fixed; network switch only changes which registry we load.
  const passphrase = networkPassphraseFor('mainnet')
  const withContract = items.filter(
    (item) => item.contract?.trim() || (item.issuer && item.code.toUpperCase() !== 'XLM')
  )
  return buildSwapProviderTokenRegistry(entriesFromTokenList(withContract, passphrase))
}

export async function loadSwapProviderRegistry(options?: {
  forceRefresh?: boolean
}): Promise<SwapProviderTokenRegistry> {
  const network = await getActiveNetwork()

  if (
    !options?.forceRefresh &&
    memoryCache &&
    memoryCache.network === network &&
    Date.now() - memoryCache.at < REGISTRY_TTL_MS
  ) {
    return memoryCache.registry
  }

  const existing = inflightByNetwork[network]
  if (existing && !options?.forceRefresh) return existing

  const loadPromise = (async (): Promise<SwapProviderTokenRegistry> => {
    const closedOverNetwork = network
    const registry =
      closedOverNetwork === 'testnet'
        ? await fetchAquariusSwapRegistry('testnet', options)
        : buildMainnetRegistry(await fetchCombinedTokenLists('mainnet'))

    // Ignore late writes after a network switch (or a newer load for this network).
    if (inflightByNetwork[closedOverNetwork] !== loadPromise) {
      return registry
    }
    const active = await getActiveNetwork()
    if (active !== closedOverNetwork) {
      return registry
    }

    memoryCache = { network: closedOverNetwork, at: Date.now(), registry }
    return registry
  })().finally(() => {
    if (inflightByNetwork[network] === loadPromise) {
      delete inflightByNetwork[network]
    }
  })

  inflightByNetwork[network] = loadPromise
  return loadPromise
}

export function resetSwapProviderRegistryCacheForTests(): void {
  memoryCache = null
  for (const key of Object.keys(inflightByNetwork) as SwapNetwork[]) {
    delete inflightByNetwork[key]
  }
}

/** Test helper: peek cached network without loading. */
export function peekSwapProviderRegistryCacheNetworkForTests(): SwapNetwork | null {
  return memoryCache?.network ?? null
}
