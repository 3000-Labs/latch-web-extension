import { describe, expect, it } from 'vitest'

import { buildMoonPayBuyUrl } from './moonpayBuyUrl'

describe('buildMoonPayBuyUrl', () => {
  it('builds sandbox URL with pool address and memo tag', () => {
    const url = buildMoonPayBuyUrl({
      apiKey: 'pk_test_abc',
      poolAddress: 'GPOOL',
      memoId: '1234567890',
      intentId: 'intent-1',
    })
    const parsed = new URL(url)
    expect(parsed.origin).toBe('https://buy-sandbox.moonpay.com')
    expect(parsed.searchParams.get('currencyCode')).toBe('xlm')
    expect(parsed.searchParams.get('walletAddress')).toBe('GPOOL')
    expect(parsed.searchParams.get('walletAddressTag')).toBe('1234567890')
    expect(parsed.searchParams.get('externalTransactionId')).toBe('intent-1')
    expect(parsed.searchParams.get('showWalletAddressForm')).toBe('true')
  })

  it('refuses unsigned live-key URLs with walletAddress', () => {
    expect(() =>
      buildMoonPayBuyUrl({
        apiKey: 'pk_live_abc',
        poolAddress: 'GPOOL',
        memoId: '1',
      })
    ).toThrow(/server-signed signature/)
  })

  it('builds signed live-key URLs with signature last', () => {
    const url = buildMoonPayBuyUrl({
      apiKey: 'pk_live_abc',
      poolAddress: 'GPOOL',
      memoId: '1',
      signature: 'sig%value',
      network: 'mainnet',
    })
    expect(new URL(url).origin).toBe('https://buy.moonpay.com')
    expect(url.endsWith('&signature=sig%25value')).toBe(true)
  })

  it('refuses live keys while on testnet', () => {
    expect(() =>
      buildMoonPayBuyUrl({
        apiKey: 'pk_live_abc',
        poolAddress: 'GPOOL',
        memoId: '1',
        signature: 'sig',
        network: 'testnet',
      })
    ).toThrow(/live keys cannot be used while the wallet is on testnet/)
  })

  it('throws when api key is missing', () => {
    expect(() =>
      buildMoonPayBuyUrl({
        apiKey: '',
        poolAddress: 'GPOOL',
        memoId: '1',
      })
    ).toThrow(/MOONPAY_API_KEY/)
  })
})
