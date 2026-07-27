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
let inflight: Promise<SwapProviderTokenRegistry> | null = null

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

  if (inflight) return inflight

  inflight = (async () => {
    const registry =
      network === 'testnet'
        ? await fetchAquariusSwapRegistry('testnet', options)
        : buildMainnetRegistry(await fetchCombinedTokenLists('mainnet'))

    memoryCache = { network, at: Date.now(), registry }
    return registry
  })().finally(() => {
    inflight = null
  })

  return inflight
}

export function resetSwapProviderRegistryCacheForTests(): void {
  memoryCache = null
  inflight = null
}
