import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { SwapProviderTokenRegistry } from '@latch/swap'

const getActiveNetwork = vi.fn(async (): Promise<'testnet' | 'mainnet'> => 'testnet')
const fetchAquariusSwapRegistry = vi.fn()
const fetchCombinedTokenLists = vi.fn()
const buildSwapProviderTokenRegistry = vi.fn(
  (): SwapProviderTokenRegistry => ({ id: 'mainnet-reg' }) as unknown as SwapProviderTokenRegistry
)
const entriesFromTokenList = vi.fn((items: unknown[]) => items)
const networkPassphraseFor = vi.fn((n: string) =>
  n === 'mainnet'
    ? 'Public Global Stellar Network ; September 2015'
    : 'Test SDF Network ; September 2015'
)

vi.mock('../network/config', () => ({
  getActiveNetwork: () => getActiveNetwork(),
  networkPassphraseFor: (n: string) => networkPassphraseFor(n),
}))

vi.mock('../assetTokenLists', () => ({
  fetchCombinedTokenLists: (...args: unknown[]) => fetchCombinedTokenLists(...args),
}))

vi.mock('@latch/swap', async () => {
  const actual = await vi.importActual<typeof import('@latch/swap')>('@latch/swap')
  return {
    ...actual,
    fetchAquariusSwapRegistry: (...args: unknown[]) => fetchAquariusSwapRegistry(...args),
    buildSwapProviderTokenRegistry: (...args: unknown[]) =>
      buildSwapProviderTokenRegistry(...args),
    entriesFromTokenList: (...args: unknown[]) => entriesFromTokenList(...args),
  }
})

import {
  loadSwapProviderRegistry,
  peekSwapProviderRegistryCacheNetworkForTests,
  resetSwapProviderRegistryCacheForTests,
} from './providerRegistry'

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((r) => {
    resolve = r
  })
  return { promise, resolve }
}

describe('loadSwapProviderRegistry network isolation', () => {
  beforeEach(() => {
    resetSwapProviderRegistryCacheForTests()
    getActiveNetwork.mockReset()
    fetchAquariusSwapRegistry.mockReset()
    fetchCombinedTokenLists.mockReset()
    buildSwapProviderTokenRegistry.mockReset()
    buildSwapProviderTokenRegistry.mockReturnValue({
      id: 'mainnet-reg',
    } as unknown as SwapProviderTokenRegistry)
    fetchCombinedTokenLists.mockResolvedValue([
      { code: 'USDC', issuer: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN' },
    ])
  })

  it('keys inflight by network so concurrent loads do not share one promise', async () => {
    const testnetGate = deferred<SwapProviderTokenRegistry>()
    const mainnetListGate = deferred<unknown[]>()

    fetchAquariusSwapRegistry.mockImplementation(() => testnetGate.promise)
    fetchCombinedTokenLists.mockImplementationOnce(() => mainnetListGate.promise as Promise<never>)

    getActiveNetwork.mockResolvedValueOnce('testnet')
    const testnetPromise = loadSwapProviderRegistry()

    getActiveNetwork.mockResolvedValue('mainnet')
    const mainnetPromise = loadSwapProviderRegistry()

    expect(testnetPromise).not.toBe(mainnetPromise)

    testnetGate.resolve({ id: 'testnet-reg' } as unknown as SwapProviderTokenRegistry)
    mainnetListGate.resolve([
      { code: 'USDC', issuer: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN' },
    ])

    const [testnetReg, mainnetReg] = await Promise.all([testnetPromise, mainnetPromise])
    expect(testnetReg).toEqual({ id: 'testnet-reg' })
    expect(mainnetReg).toEqual({ id: 'mainnet-reg' })
  })

  it('does not let a late testnet completion overwrite a mainnet cache', async () => {
    const lateTestnet = deferred<SwapProviderTokenRegistry>()
    fetchAquariusSwapRegistry.mockImplementation(() => lateTestnet.promise)

    getActiveNetwork.mockResolvedValueOnce('testnet')
    const testnetPromise = loadSwapProviderRegistry()

    getActiveNetwork.mockResolvedValue('mainnet')
    const mainnetReg = await loadSwapProviderRegistry()
    expect(mainnetReg).toEqual({ id: 'mainnet-reg' })
    expect(peekSwapProviderRegistryCacheNetworkForTests()).toBe('mainnet')

    lateTestnet.resolve({ id: 'stale-testnet' } as unknown as SwapProviderTokenRegistry)
    await testnetPromise

    expect(peekSwapProviderRegistryCacheNetworkForTests()).toBe('mainnet')
  })

  it('returns cached registry for the same network within TTL', async () => {
    fetchAquariusSwapRegistry.mockResolvedValue({
      id: 'testnet-once',
    } as unknown as SwapProviderTokenRegistry)
    getActiveNetwork.mockResolvedValue('testnet')

    const a = await loadSwapProviderRegistry()
    const b = await loadSwapProviderRegistry()
    expect(a).toBe(b)
    expect(fetchAquariusSwapRegistry).toHaveBeenCalledTimes(1)
  })
})
