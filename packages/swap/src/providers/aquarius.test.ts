import { describe, expect, it } from 'vitest'

import { parseAquariusFindPathResponse } from './aquarius'
import type { SwapQuoteRequest } from '../types'

const baseReq: SwapQuoteRequest = {
  network: 'testnet',
  assetIn: {
    assetId: 'native',
    symbol: 'XLM',
    contractId: 'CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA',
    decimals: 7,
  },
  assetOut: {
    assetId: 'USDC',
    symbol: 'USDC',
    contractId: 'CCW67TSZV3SSFYW6YTWS2NCNKVEMFVR2DGPN3DQQMQS3N4QF7TEZNAWM',
    decimals: 7,
  },
  amountInRaw: '10000000',
  slippageBps: 50,
  recipient: 'CABC123',
}

describe('parseAquariusFindPathResponse', () => {
  it('parses successful find-path payload', () => {
    const quote = parseAquariusFindPathResponse(
      {
        success: true,
        amount: 9950000,
        swap_chain_xdr: 'AAAAEA==',
        pools: ['CPOOL'],
        tokens: ['native', 'USDC:GISSUER'],
      },
      baseReq
    )
    expect(quote.providerId).toBe('aquarius')
    expect(quote.amountOutRaw).toBe('9950000')
    expect(quote.amountOutMinRaw).toBe('9900250')
    expect(quote.pathLabels).toEqual(['XLM', 'USDC'])
    expect(quote.buildPayload).toMatchObject({
      kind: 'aquarius',
      swapChainXdr: 'AAAAEA==',
    })
  })

  it('throws when route not found', () => {
    expect(() =>
      parseAquariusFindPathResponse({ success: false, error: 'no path' }, baseReq)
    ).toThrow('no path')
  })
})
