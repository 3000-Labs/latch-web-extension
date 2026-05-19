import { Keypair } from '@stellar/stellar-sdk'
import { describe, expect, it } from 'vitest'

import { isValidStellarCAddress, isValidStellarGAddress, truncateMiddle } from './sendAddress'

describe('sendAddress', () => {
  it('validates G addresses', () => {
    const g = Keypair.random().publicKey()
    expect(isValidStellarGAddress(g)).toBe(true)
    expect(isValidStellarGAddress('GINVALID')).toBe(false)
  })

  it('truncates middle of long strings', () => {
    const g = Keypair.random().publicKey()
    expect(truncateMiddle(g, 4, 4)).toBe(`${g.slice(0, 4)}...${g.slice(-4)}`)
  })

  it('rejects invalid C addresses', () => {
    expect(isValidStellarCAddress('Cshort')).toBe(false)
  })
})
