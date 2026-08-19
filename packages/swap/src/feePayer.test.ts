import { describe, expect, it, vi } from 'vitest'

import { resolveBundlerPublicG, resolveSwapTransactionSourceG } from './feePayer'

describe('resolveBundlerPublicG', () => {
  it('returns testnet fee payer G from env', () => {
    vi.stubEnv(
      'PLASMO_PUBLIC_LATCH_FEE_PAYER_G',
      'GBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB'
    )
    expect(resolveBundlerPublicG('testnet')).toBe(
      'GBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB'
    )
    vi.unstubAllEnvs()
  })

  it('does not fall back to testnet on mainnet', () => {
    vi.stubEnv(
      'PLASMO_PUBLIC_LATCH_FEE_PAYER_G',
      'GTESTNETFEEPAYERXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
    )
    vi.stubEnv('PLASMO_PUBLIC_LATCH_FEE_PAYER_G_MAINNET', '')
    expect(resolveBundlerPublicG('mainnet')).toBeUndefined()
    vi.unstubAllEnvs()
  })
})

describe('resolveSwapTransactionSourceG', () => {
  it('prefers account gAddress', () => {
    expect(
      resolveSwapTransactionSourceG({
        gAddress: 'GCRN5PMAG5FM5QLCH7BUZPRQ7UIW37LBZLF2BIDEOSG4ZQ6HYRC45ALA',
      })
    ).toBe('GCRN5PMAG5FM5QLCH7BUZPRQ7UIW37LBZLF2BIDEOSG4ZQ6HYRC45ALA')
  })

  it('falls back to testnet env fee payer', () => {
    vi.stubEnv(
      'PLASMO_PUBLIC_LATCH_FEE_PAYER_G',
      'GBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB'
    )
    expect(resolveSwapTransactionSourceG({})).toBe(
      'GBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB'
    )
    vi.unstubAllEnvs()
  })

  it('uses mainnet env fee payer and does not fall back to testnet', () => {
    vi.stubEnv(
      'PLASMO_PUBLIC_LATCH_FEE_PAYER_G',
      'GTESTNETFEEPAYERXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
    )
    vi.stubEnv(
      'PLASMO_PUBLIC_LATCH_FEE_PAYER_G_MAINNET',
      'GMAINNETFEEPAYERXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
    )
    expect(resolveSwapTransactionSourceG({ network: 'mainnet' })).toBe(
      'GMAINNETFEEPAYERXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
    )
    vi.unstubAllEnvs()
  })

  it('throws on mainnet when only the testnet fee payer env is set', () => {
    vi.stubEnv(
      'PLASMO_PUBLIC_LATCH_FEE_PAYER_G',
      'GTESTNETFEEPAYERXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
    )
    vi.stubEnv('PLASMO_PUBLIC_LATCH_FEE_PAYER_G_MAINNET', '')
    expect(() => resolveSwapTransactionSourceG({ network: 'mainnet' })).toThrow(
      /LATCH_FEE_PAYER_G_MAINNET/
    )
    vi.unstubAllEnvs()
  })

  it('throws when no G-address is available', () => {
    vi.stubEnv('PLASMO_PUBLIC_LATCH_FEE_PAYER_G', '')
    expect(() => resolveSwapTransactionSourceG({ gAddress: 'CABC' })).toThrow(/fee payer G-address/)
    vi.unstubAllEnvs()
  })
})
