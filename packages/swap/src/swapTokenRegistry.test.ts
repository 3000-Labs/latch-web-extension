import { describe, expect, it } from 'vitest'

import {
  buildSwapProviderTokenRegistry,
  entriesFromAquariusPools,
  parseAquariusPoolTokenLabel,
} from './swapTokenRegistry'

describe('parseAquariusPoolTokenLabel', () => {
  it('parses native XLM', () => {
    expect(parseAquariusPoolTokenLabel('native')).toEqual({
      symbol: 'XLM',
      assetId: 'native',
    })
  })

  it('parses CODE:ISSUER labels', () => {
    expect(
      parseAquariusPoolTokenLabel(
        'USDC:GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'
      )
    ).toEqual({
      symbol: 'USDC',
      issuer: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
      assetId: 'USDC',
    })
  })
})

describe('entriesFromAquariusPools', () => {
  it('dedupes tokens across pools', () => {
    const entries = entriesFromAquariusPools([
      {
        tokens_addresses: [
          'CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA',
          'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
        ],
        tokens_str: [
          'USDC:GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
          'native',
        ],
      },
      {
        tokens_addresses: [
          'CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA',
          'CDNVQW44C3HALYNVQ4SOBXY5EWYTGVYXX6JPESOLQDABJI5FC5LTRRUE',
        ],
        tokens_str: [
          'USDC:GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
          'AQUA:GAHPYWLK6YRN7CVYZOO4H3VDRZ7PVF5UJGLZCSPAEIKJE2XSWF5LAGER',
        ],
      },
    ])

    const registry = buildSwapProviderTokenRegistry(entries)
    expect(registry.byContractId.size).toBe(3)
    expect(
      registry.byAssetKey.get(
        'USDC:GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'
      )?.contractId
    ).toBe('CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA')
    expect(registry.byAssetKey.get('native')?.contractId).toBe(
      'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC'
    )
  })
})
