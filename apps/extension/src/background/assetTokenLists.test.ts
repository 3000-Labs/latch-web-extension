import { describe, expect, it } from 'vitest'

import {
  buildTokenMap,
  iconFromTokenMap,
  iconFromTokenLists,
  listJsonMatchesNetwork,
  type TokenListItem,
} from './assetTokenLists'

const lists: TokenListItem[] = [
  {
    code: 'USDC',
    issuer: 'GBBD47IF6L27R6SAA3BVWFXNUG7QLYZNH7ZWK5CT4OEK2LDXZ2BJZK2',
    contract: 'CBIELTK6YBZJU5UP2WWQ3ROF7NHHELKHUV6FJOL7REJOGLR7ATZ6',
    icon: 'https://example.com/usdc.png',
  },
  {
    code: 'USDC',
    issuer: 'GOTHER',
    contract: 'COTHER',
    icon: 'https://example.com/usdc-other.png',
  },
  {
    code: 'XLM',
    issuer: '',
    contract: 'C_NATIVE',
    icon: 'https://example.com/xlm.png',
  },
]

const map = buildTokenMap(lists)

describe('buildTokenMap', () => {
  it('keys by symbol and symbol:issuer with first occurrence winning', () => {
    expect(map.USDC?.icon).toBe('https://example.com/usdc.png')
    expect(map['USDC:GBBD47IF6L27R6SAA3BVWFXNUG7QLYZNH7ZWK5CT4OEK2LDXZ2BJZK2']?.icon).toBe(
      'https://example.com/usdc.png'
    )
    expect(map['USDC:GOTHER']?.icon).toBe('https://example.com/usdc-other.png')
  })
})

describe('iconFromTokenMap', () => {
  it('matches by sac contract id', () => {
    expect(
      iconFromTokenMap(map, {
        code: 'USDC',
        sacContractId: 'CBIELTK6YBZJU5UP2WWQ3ROF7NHHELKHUV6FJOL7REJOGLR7ATZ6',
      })
    ).toBe('https://example.com/usdc.png')
  })

  it('matches by code and issuer full key', () => {
    expect(
      iconFromTokenMap(map, {
        code: 'USDC',
        issuer: 'GBBD47IF6L27R6SAA3BVWFXNUG7QLYZNH7ZWK5CT4OEK2LDXZ2BJZK2',
      })
    ).toBe('https://example.com/usdc.png')
  })

  it('matches by symbol-only when issuer omitted', () => {
    expect(iconFromTokenMap(map, { code: 'USDC' })).toBe('https://example.com/usdc.png')
  })

  it('returns null for unknown assets', () => {
    expect(iconFromTokenMap(map, { code: 'UNKNOWN' })).toBeNull()
  })
})

describe('listJsonMatchesNetwork', () => {
  it('rejects mainnet-declared lists on testnet', () => {
    expect(listJsonMatchesNetwork({ network: 'mainnet', assets: [] }, 'testnet')).toBe(false)
    expect(listJsonMatchesNetwork({ network: 'mainnet', assets: [] }, 'mainnet')).toBe(true)
  })

  it('accepts lists without a network field', () => {
    expect(listJsonMatchesNetwork({ assets: [] }, 'testnet')).toBe(true)
  })
})

describe('iconFromTokenLists', () => {
  it('returns null for native XLM so UI uses bundled Stellar mark', () => {
    expect(iconFromTokenLists([lists[2]!], { code: 'XLM' })).toBeNull()
  })
})
