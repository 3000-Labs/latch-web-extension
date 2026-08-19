import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { V1TokenPair } from '@latch/types'

const getActiveNetwork = vi.fn(async () => 'testnet' as const)

vi.mock('../network/config', () => ({
  getActiveNetwork: () => getActiveNetwork(),
}))

import {
  clearV1TokenPair,
  getV1TokenPair,
  resetV1TokenLegacyPruneFlag,
  setV1TokenPair,
  v1TokenStorageKey,
} from './v1TokenStorage'

const STORAGE_KEY = 'latch.v1TokensByWallet'

describe('v1TokenStorage network scoping', () => {
  let store: Record<string, unknown>

  beforeEach(() => {
    resetV1TokenLegacyPruneFlag()
    getActiveNetwork.mockResolvedValue('testnet')
    store = {}
    vi.stubGlobal('chrome', {
      storage: {
        local: {
          get: vi.fn(async (keys: string | string[]) => {
            const list = Array.isArray(keys) ? keys : [keys]
            const out: Record<string, unknown> = {}
            for (const k of list) out[k] = store[k]
            return out
          }),
          set: vi.fn(async (patch: Record<string, unknown>) => {
            Object.assign(store, patch)
          }),
        },
      },
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('does not return a testnet pair while mainnet is active', async () => {
    const pair: V1TokenPair = {
      accessToken: 'testnet-tok',
      refreshToken: 'ref',
      expiresAt: Date.now() + 60_000,
      wallet: 'CABC',
    }
    await setV1TokenPair('CABC', pair)
    expect(store[STORAGE_KEY]).toMatchObject({
      [v1TokenStorageKey('testnet', 'CABC')]: pair,
    })

    getActiveNetwork.mockResolvedValue('mainnet')
    expect(await getV1TokenPair('CABC')).toBeUndefined()
  })

  it('prunes legacy bare-wallet keys on read', async () => {
    store[STORAGE_KEY] = {
      CABC: {
        accessToken: 'legacy',
        refreshToken: 'ref',
        expiresAt: Date.now() + 60_000,
        wallet: 'CABC',
      },
    }
    expect(await getV1TokenPair('CABC')).toBeUndefined()
    expect((store[STORAGE_KEY] as Record<string, unknown>).CABC).toBeUndefined()
  })

  it('clears only the active-network scoped entry', async () => {
    const testnetPair: V1TokenPair = {
      accessToken: 't',
      refreshToken: 'r',
      expiresAt: Date.now() + 60_000,
      wallet: 'CABC',
    }
    await setV1TokenPair('CABC', testnetPair)
    getActiveNetwork.mockResolvedValue('mainnet')
    await setV1TokenPair('CABC', { ...testnetPair, accessToken: 'm' })

    getActiveNetwork.mockResolvedValue('testnet')
    await clearV1TokenPair('CABC')

    const tokens = store[STORAGE_KEY] as Record<string, V1TokenPair>
    expect(tokens[v1TokenStorageKey('testnet', 'CABC')]).toBeUndefined()
    expect(tokens[v1TokenStorageKey('mainnet', 'CABC')]?.accessToken).toBe('m')
  })
})
