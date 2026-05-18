import { describe, expect, it } from 'vitest'

import { iconFromTokenLists, type AssetListItem } from './assetTokenLists'

const lists: AssetListItem[] = [
  {
    code: 'USDC',
    issuer: 'GBBD47IF6L27R6SAA3BVWFXNUG7QLYZNH7ZWK5CT4OEK2LDXZ2BJZK2',
    contract: 'CBIELTK6YBZJU5UP2WWQ3ROF7NHHELKHUV6FJOL7REJOGLR7ATZ6',
    icon: 'https://example.com/usdc.png',
  },
  {
    code: 'XLM',
    issuer: '',
    contract: 'C_NATIVE',
    icon: 'https://example.com/xlm.png',
  },
]

describe('iconFromTokenLists', () => {
  it('matches by sac contract id', () => {
    expect(
      iconFromTokenLists(lists, {
        code: 'USDC',
        sacContractId: 'CBIELTK6YBZJU5UP2WWQ3ROF7NHHELKHUV6FJOL7REJOGLR7ATZ6',
      }),
    ).toBe('https://example.com/usdc.png')
  })

  it('matches by code when only one list entry', () => {
    expect(iconFromTokenLists([lists[1]!], { code: 'XLM' })).toBe('https://example.com/xlm.png')
  })
})
