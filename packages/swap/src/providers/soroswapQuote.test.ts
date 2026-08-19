import { describe, expect, it } from 'vitest'

import {
  normalizePoolHashForBuild,
  normalizeSoroswapQuoteForBuild,
  poolHashToBytes,
} from './soroswapQuote'

describe('poolHashToBytes / normalizePoolHashForBuild', () => {
  it('converts 64-char hex Aquarius indexes to Base64 BytesN<32>', () => {
    expect(
      normalizePoolHashForBuild('b2e02fcfca6c96f8ad5cbd84e7784a777b36d9c96a2459402c4f458462aab7f0')
    ).toBe('suAvz8pslvitXL2E53hKd3s22clqJFlALE9FhGKqt/A=')
    expect(
      poolHashToBytes('b2e02fcfca6c96f8ad5cbd84e7784a777b36d9c96a2459402c4f458462aab7f0').toString(
        'base64'
      )
    ).toBe('suAvz8pslvitXL2E53hKd3s22clqJFlALE9FhGKqt/A=')
  })

  it('leaves valid Base64 pool hashes unchanged via normalize', () => {
    const b64 = 'suAvz8pslvitXL2E53hKd3s22clqJFlALE9FhGKqt/A='
    expect(normalizePoolHashForBuild(b64)).toBe(b64)
  })
})

describe('normalizeSoroswapQuoteForBuild', () => {
  it('rewrites hex poolHashes inside rawTrade.distribution', () => {
    const quote = {
      amountOut: 696200,
      rawTrade: {
        amountIn: '1000000',
        amountOutMin: '692719',
        distribution: [
          {
            protocol_id: 'aqua',
            path: ['CA', 'CB', 'CC'],
            parts: 10,
            is_exact_in: true,
            poolHashes: [
              'b2e02fcfca6c96f8ad5cbd84e7784a777b36d9c96a2459402c4f458462aab7f0',
              '24f9c991c44acf33fff5f44031c40385d235dc212d7379e824ba3db1c35371f3',
            ],
          },
        ],
      },
    }

    const normalized = normalizeSoroswapQuoteForBuild(quote)
    const hashes = (normalized.rawTrade as { distribution: { poolHashes: string[] }[] })
      .distribution[0].poolHashes

    expect(hashes).toEqual([
      'suAvz8pslvitXL2E53hKd3s22clqJFlALE9FhGKqt/A=',
      'JPnJkcRKzzP/9fRAMcQDhdI13CEtc3noJLo9scNTcfM=',
    ])
    // Original quote must not be mutated (cached quotes are reused).
    expect((quote.rawTrade.distribution[0].poolHashes as string[])[0]).toBe(
      'b2e02fcfca6c96f8ad5cbd84e7784a777b36d9c96a2459402c4f458462aab7f0'
    )
  })
})
