import { describe, expect, it, vi } from 'vitest'

import type { ApiSmartAccountBalance } from '@latch/types'

import { mapApiBalanceToRow } from './smartAccountBalancesApi'

describe('smartAccountBalancesApi', () => {
  it('maps API balance JSON to SmartAccountBalanceRow', () => {
    const balance: ApiSmartAccountBalance = {
      assetId: 'native',
      symbol: 'XLM',
      name: 'Stellar Lumens',
      contractId: 'CAS3...',
      decimals: 7,
      balance: '12.5',
      balanceRaw: '125000000',
    }

    const row = mapApiBalanceToRow(balance, 'https://icon.test/xlm.png')

    expect(row).toMatchObject({
      code: 'XLM',
      sacContractId: 'CAS3...',
      assetId: 'native',
      decimals: 7,
      amount: '12.5',
      iconUrl: 'https://icon.test/xlm.png',
    })
    expect(row.balanceUsd).toBeDefined()
  })

  it('computes USD from symbol when price is known', () => {
    const balance: ApiSmartAccountBalance = {
      assetId: 'usdc',
      symbol: 'USDC',
      name: 'USD Coin',
      contractId: 'CAS4...',
      decimals: 7,
      balance: '10',
      balanceRaw: '100000000',
    }

    const row = mapApiBalanceToRow(balance, null)
    expect(row.balanceUsd).toBe('10.00')
  })
})
