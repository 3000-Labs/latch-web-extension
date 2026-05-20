import { Keypair, Networks } from '@stellar/stellar-sdk'
import { describe, expect, it } from 'vitest'

import {
  migrableAssetsFromHorizonAccount,
  parseHorizonAccountJson,
  stellarMinReserveXlm,
} from './migrationBalances'

describe('stellarMinReserveXlm', () => {
  it('matches (2 + subentries) * 0.5', () => {
    expect(stellarMinReserveXlm(0)).toBe(1)
    expect(stellarMinReserveXlm(2)).toBe(2)
    expect(stellarMinReserveXlm(4)).toBe(3)
  })
})

describe('migrableAssetsFromHorizonAccount', () => {
  const phrase = Networks.TESTNET

  it('lists native when balance exceeds reserve', () => {
    const account = parseHorizonAccountJson({
      id: 'GTEST',
      sequence: '1',
      subentry_count: 0,
      balances: [{ asset_type: 'native', balance: '5.0000000' }],
    })!
    const assets = migrableAssetsFromHorizonAccount(account, phrase)
    expect(assets.some((a) => a.kind === 'native')).toBe(true)
    const xlm = assets.find((a) => a.kind === 'native')!
    expect(Number.parseFloat(xlm.amount)).toBeGreaterThan(3)
  })

  it('omits native when only reserve remains', () => {
    const account = parseHorizonAccountJson({
      id: 'GTEST',
      sequence: '1',
      subentry_count: 0,
      balances: [{ asset_type: 'native', balance: '1.0000000' }],
    })!
    const assets = migrableAssetsFromHorizonAccount(account, phrase)
    expect(assets.filter((a) => a.kind === 'native')).toHaveLength(0)
  })

  it('includes positive trustline balances', () => {
    const issuer = Keypair.random().publicKey()
    const account = parseHorizonAccountJson({
      id: 'GTEST',
      sequence: '1',
      subentry_count: 1,
      balances: [
        { asset_type: 'native', balance: '10.0000000' },
        {
          asset_type: 'credit_alphanum4',
          asset_code: 'USDC',
          asset_issuer: issuer,
          balance: '25.0000000',
        },
      ],
    })!
    const assets = migrableAssetsFromHorizonAccount(account, phrase)
    const usdc = assets.find((a) => a.code === 'USDC')
    expect(usdc?.kind).toBe('token')
    expect(usdc?.sacContractId.length).toBeGreaterThan(10)
  })
})

describe('parseHorizonAccountJson', () => {
  it('returns null for invalid payloads', () => {
    expect(parseHorizonAccountJson(null)).toBeNull()
    expect(parseHorizonAccountJson({})).toBeNull()
  })
})
