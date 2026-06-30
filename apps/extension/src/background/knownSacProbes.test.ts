import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getKnownSacProbes, recordKnownSacProbe } from './knownSacProbes'

vi.mock('./migration/env', () => ({
  getStellarNetworkFromEnv: () => 'testnet',
}))

describe('knownSacProbes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('records and reads probes by account', async () => {
    await recordKnownSacProbe('acc-1', {
      code: 'USDC',
      issuer: 'GISSUER',
      sacContractId: 'CUSDC',
    })
    const probes = await getKnownSacProbes('acc-1')
    expect(probes).toHaveLength(1)
    expect(probes[0]!.sacContractId).toBe('CUSDC')
  })

  it('dedupes by sacContractId on re-record', async () => {
    const probe = { code: 'USDC', issuer: 'GISSUER', sacContractId: 'CUSDC' }
    await recordKnownSacProbe('acc-1', probe)
    await recordKnownSacProbe('acc-1', { ...probe, code: 'USD Coin' })
    const probes = await getKnownSacProbes('acc-1')
    expect(probes).toHaveLength(1)
    expect(probes[0]!.code).toBe('USD Coin')
  })
})
