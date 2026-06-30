import type { SwapNetwork, SwapProvider, SwapProviderMeta } from './types'
import { aquariusProvider } from './providers/aquarius'
import { mockSwapProvider } from './providers/mock'
import { soroswapProvider } from './providers/soroswap'

function useMockSwap(): boolean {
  return process.env.PLASMO_PUBLIC_SWAP_USE_MOCK === 'true'
}

function providersForNetwork(network: SwapNetwork): SwapProvider[] {
  if (network === 'testnet') {
    return [useMockSwap() ? mockSwapProvider : aquariusProvider]
  }
  return [soroswapProvider]
}

export function listSwapProviders(network: SwapNetwork): SwapProviderMeta[] {
  return providersForNetwork(network).map(({ id, name }) => ({ id, name }))
}

export function getActiveSwapProvider(network: SwapNetwork, id?: string): SwapProvider {
  const providers = providersForNetwork(network)
  return providers.find((p) => p.id === id) ?? providers[0]
}

export { aquariusProvider, mockSwapProvider, soroswapProvider }
