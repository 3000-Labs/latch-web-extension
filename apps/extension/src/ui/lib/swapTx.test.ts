import { describe, expect, it, vi } from 'vitest'

import type { BuildSendTxResponse, StoredAccount, SwapQuotePayload } from '@latch/types'

import {
  resolveSwapRouterContractId,
  swapBuildNeedsSignerReconfigure,
} from './swapTx'

vi.mock('./activeNetwork', () => ({
  fetchActiveNetwork: vi.fn(async () => ({ network: 'mainnet' as const })),
}))

const passkeyAccount: StoredAccount = {
  id: '1',
  mode: 'passkey',
  smartAccountAddress: 'CC3L3ACABZIRMM5OJDQ6CFV27HWP3ITZ5GOAF6ZIAYTNFWY7AM3VXWXW',
  passkeyCredentialId: 'cred',
  passkeyKeyDataHex: 'aa'.repeat(32),
}

const freighterAccount: StoredAccount = {
  id: '2',
  mode: 'freighter',
  smartAccountAddress: 'CC3L3ACABZIRMM5OJDQ6CFV27HWP3ITZ5GOAF6ZIAYTNFWY7AM3VXWXW',
  gAddress: 'GUSER123456789012345678901234567890123456789012345678901234',
}

function baseBuild(overrides: Partial<BuildSendTxResponse> = {}): BuildSendTxResponse {
  return {
    txXdr: 'tx',
    authEntryXdr: 'auth',
    contextRuleId: 14,
    authDigestHex: 'abcd',
    validUntilLedger: 100,
    ...overrides,
  }
}

function baseQuote(overrides: Partial<SwapQuotePayload> = {}): SwapQuotePayload {
  return {
    providerId: 'soroswap',
    providerName: 'Soroswap',
    amountInRaw: '10000000',
    amountOutRaw: '9000000',
    amountOutMinRaw: '8900000',
    pathLabels: ['XLM', 'USDC'],
    expiresAtMs: Date.now() + 60_000,
    slippageBps: 50,
    assetIn: {
      id: 'xlm',
      assetId: 'native',
      symbol: 'XLM',
      name: 'Stellar',
      contractId: 'CDLZFC3SYJYDZT7K67MOXKV5WG76VMTOMEBV',
      decimals: 7,
      balance: '0',
    },
    assetOut: {
      id: 'usdc',
      assetId: 'USDC',
      symbol: 'USDC',
      name: 'USD Coin',
      contractId: 'CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXTSYAOBMTK',
      decimals: 7,
      balance: '0',
    },
    buildPayload: { kind: 'soroswap', quote: {} },
    ...overrides,
  }
}

describe('resolveSwapRouterContractId', () => {
  it('resolves Soroswap aggregator on mainnet when payload omits router', () => {
    expect(resolveSwapRouterContractId(baseQuote(), 'mainnet')).toBe(
      'CAYP3UWLJM7ZPTUKL6R6BFGTRWLZ46LRKOXTERI2K6BIJAWGYY62TXTO'
    )
  })

  it('prefers routerContractId from the build payload when present', () => {
    expect(
      resolveSwapRouterContractId(
        baseQuote({
          buildPayload: {
            kind: 'soroswap',
            quote: {},
            routerContractId: 'CROUTERFROMQUOTE000000000000000000000000000000000000000',
          },
        }),
        'mainnet'
      )
    ).toBe('CROUTERFROMQUOTE000000000000000000000000000000000000000')
  })

  it('resolves Aquarius router on testnet', () => {
    expect(
      resolveSwapRouterContractId(
        baseQuote({
          providerId: 'aquarius',
          providerName: 'Aquarius',
          buildPayload: { kind: 'aquarius' },
        }),
        'testnet'
      )
    ).toBe('CBCFTQSPDBAIZ6R6PJQKSQWKNKWH2QIV3I4J72SHWBIK3ADRRAM5A6GD')
  })
})

describe('swapBuildNeedsSignerReconfigure', () => {
  it('returns true for passkey when submitMethod is bundler-delegated', () => {
    expect(
      swapBuildNeedsSignerReconfigure(
        baseBuild({ submitMethod: 'bundler-delegated' }),
        passkeyAccount
      )
    ).toBe(true)
  })

  it('returns false for freighter when submitMethod is bundler-delegated', () => {
    expect(
      swapBuildNeedsSignerReconfigure(
        baseBuild({ submitMethod: 'bundler-delegated' }),
        freighterAccount
      )
    ).toBe(false)
  })

  it('returns true for legacy bundler-prefilled smart-account auth builds', () => {
    expect(
      swapBuildNeedsSignerReconfigure(
        baseBuild({
          smartAccountAuthEntryXdr: 'smart',
          delegatedGAuthEntrySynthesized: true,
        }),
        passkeyAccount
      )
    ).toBe(true)
  })

  it('returns false for normal passkey webauthn swap builds', () => {
    expect(
      swapBuildNeedsSignerReconfigure(
        baseBuild({ submitMethod: 'webauthn', delegatedGAuthEntrySynthesized: true }),
        passkeyAccount
      )
    ).toBe(false)
  })
})
