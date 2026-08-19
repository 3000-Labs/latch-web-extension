import { Asset, Networks, StrKey } from '@stellar/stellar-sdk'
import { describe, expect, it } from 'vitest'

import { curatedPortfolioProbes } from './curatedAssets'
import { mergePortfolioProbes } from './portfolioProbes'

const TESTNET_USDC_ISSUER = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'
const MAINNET_USDC_ISSUER = 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN'

describe('mergePortfolioProbes', () => {
  it('dedupes by sacContractId and keeps XLM first', () => {
    const native = Asset.native().contractId(Networks.TESTNET)
    const merged = mergePortfolioProbes([
      [
        { code: 'USDC', issuer: TESTNET_USDC_ISSUER, sacContractId: 'CUSDC1' },
        { code: 'XLM', sacContractId: native },
      ],
      [{ code: 'XLM', sacContractId: native }],
    ])
    expect(merged).toHaveLength(2)
    expect(merged[0]!.code).toBe('XLM')
    expect(merged[0]!.sacContractId).toBe(native)
  })
})

describe('curatedPortfolioProbes', () => {
  it('derives testnet USDC SAC from issuer not mainnet contract field', () => {
    const probes = curatedPortfolioProbes(Networks.TESTNET, 'testnet')
    const usdc = probes.find((p) => p.code === 'USDC')
    expect(usdc?.issuer).toBe(TESTNET_USDC_ISSUER)
    const expected = new Asset('USDC', TESTNET_USDC_ISSUER).contractId(Networks.TESTNET)
    expect(usdc?.sacContractId).toBe(expected)

    const mainnetContract = new Asset('USDC', MAINNET_USDC_ISSUER).contractId(Networks.PUBLIC)
    const mainnetHex = Buffer.from(StrKey.decodeContract(mainnetContract)).toString('hex')
    const testnetHex = Buffer.from(StrKey.decodeContract(expected)).toString('hex')
    expect(testnetHex).not.toBe(mainnetHex)
  })

  it('includes curated tokens without gAddress requirement', () => {
    const probes = curatedPortfolioProbes(Networks.TESTNET, 'testnet')
    expect(probes.some((p) => p.code === 'USDC')).toBe(true)
    expect(probes.some((p) => p.code === 'EURC')).toBe(true)
  })
})
