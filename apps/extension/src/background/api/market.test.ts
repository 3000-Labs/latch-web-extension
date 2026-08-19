import { describe, expect, it } from 'vitest'

import { normalizeMarketPricesData } from './market'

describe('api/market', () => {
  it('normalizes object entries with price and change_24h', () => {
    expect(
      normalizeMarketPricesData({
        xlm: { price: '0.12', change_24h: 1.5 },
        usdc: { price: 1, change_24h: 0 },
      })
    ).toEqual({
      XLM: { priceUsd: 0.12, change24h: 1.5 },
      USDC: { priceUsd: 1, change24h: 0 },
    })
  })

  it('normalizes bare number entries (Swagger float map)', () => {
    expect(
      normalizeMarketPricesData({
        native: 0.11,
        xlm: 0.11,
      })
    ).toEqual({
      NATIVE: { priceUsd: 0.11, change24h: 0 },
      XLM: { priceUsd: 0.11, change24h: 0 },
    })
  })

  it('skips invalid entries', () => {
    expect(
      normalizeMarketPricesData({
        bad: { price: 'n/a' },
        ok: 2,
      })
    ).toEqual({
      OK: { priceUsd: 2, change24h: 0 },
    })
  })
})
