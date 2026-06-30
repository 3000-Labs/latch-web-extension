import { describe, expect, it, vi } from 'vitest'

import { resolveSwapTransactionSourceG } from './feePayer'

describe('resolveSwapTransactionSourceG', () => {
  it('prefers account gAddress', () => {
    expect(
      resolveSwapTransactionSourceG({ gAddress: 'GCRN5PMAG5FM5QLCH7BUZPRQ7UIW37LBZLF2BIDEOSG4ZQ6HYRC45ALA' })
    ).toBe('GCRN5PMAG5FM5QLCH7BUZPRQ7UIW37LBZLF2BIDEOSG4ZQ6HYRC45ALA')
  })

  it('falls back to env fee payer', () => {
    vi.stubEnv('PLASMO_PUBLIC_LATCH_FEE_PAYER_G', 'GBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB')
    expect(resolveSwapTransactionSourceG({})).toBe(
      'GBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB'
    )
    vi.unstubAllEnvs()
  })

  it('throws when no G-address is available', () => {
    vi.stubEnv('PLASMO_PUBLIC_LATCH_FEE_PAYER_G', '')
    expect(() => resolveSwapTransactionSourceG({ gAddress: 'CABC' })).toThrow(
      /fee payer G-address/
    )
    vi.unstubAllEnvs()
  })
})
