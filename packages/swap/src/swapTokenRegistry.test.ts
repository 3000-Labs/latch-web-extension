import { Asset, Networks, StrKey } from '@stellar/stellar-sdk'
import { describe, expect, it } from 'vitest'

import {
  buildSwapProviderTokenRegistry,
  entriesFromAquariusPools,
  normalizeStellarContractId,
  parseAquariusPoolTokenLabel,
  resolveTokenListContractId,
} from './swapTokenRegistry'

describe('normalizeStellarContractId', () => {
  it('passes through valid C-addresses', () => {
    const c = Asset.native().contractId(Networks.PUBLIC)
    expect(normalizeStellarContractId(c)).toBe(c)
  })

  it('encodes 32-byte hex to a C-address', () => {
    const c = new Asset(
      'USDC',
      'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN'
    ).contractId(Networks.PUBLIC)
    const hex = Buffer.from(StrKey.decodeContract(c)).toString('hex')
    expect(hex).toBe('adefce59aee52968f76061d494c2525b75659fa4296a65f499ef29e56477e496')
    expect(normalizeStellarContractId(hex)).toBe(c)
  })

  it('returns null for garbage', () => {
    expect(normalizeStellarContractId('not-a-contract')).toBeNull()
    expect(normalizeStellarContractId('')).toBeNull()
  })
})

describe('resolveTokenListContractId', () => {
  const MAINNET_USDC_ISSUER = 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN'

  it('prefers issuer-derived SAC over hex contract from lists', () => {
    const expected = new Asset('USDC', MAINNET_USDC_ISSUER).contractId(Networks.PUBLIC)
    expect(
      resolveTokenListContractId(
        {
          code: 'USDC',
          issuer: MAINNET_USDC_ISSUER,
          contract: 'adefce59aee52968f76061d494c2525b75659fa4296a65f499ef29e56477e496',
        },
        Networks.PUBLIC
      )
    ).toBe(expected)
  })

  it('normalizes hex contract when issuer is missing', () => {
    const expected = new Asset('USDC', MAINNET_USDC_ISSUER).contractId(Networks.PUBLIC)
    expect(
      resolveTokenListContractId(
        {
          code: 'CUSTOM',
          contract: 'adefce59aee52968f76061d494c2525b75659fa4296a65f499ef29e56477e496',
        },
        Networks.PUBLIC
      )
    ).toBe(expected)
  })
})

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
