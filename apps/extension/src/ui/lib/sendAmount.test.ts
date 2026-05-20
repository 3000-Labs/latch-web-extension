import { describe, expect, it } from 'vitest'

import {
  cryptoToFiat,
  fiatToCrypto,
  hasValidDecimalPlaces,
  isAmountWithinBalance,
  parsePositiveAmount,
} from './sendAmount'

describe('sendAmount', () => {
  it('converts crypto to fiat', () => {
    expect(cryptoToFiat('10', 0.16)).toBe('1.60')
  })

  it('converts fiat to crypto', () => {
    expect(fiatToCrypto('1.60', 0.16)).toBe('10')
  })

  it('parses positive amounts', () => {
    expect(parsePositiveAmount('0.5')).toBe(0.5)
    expect(parsePositiveAmount('0')).toBeNull()
    expect(parsePositiveAmount('')).toBeNull()
  })

  it('checks balance bounds', () => {
    expect(isAmountWithinBalance('5', '10')).toBe(true)
    expect(isAmountWithinBalance('15', '10')).toBe(false)
  })

  it('validates fractional digits against asset decimals', () => {
    expect(hasValidDecimalPlaces('1.234567', 7)).toBe(true)
    expect(hasValidDecimalPlaces('1.23456789', 7)).toBe(false)
    expect(hasValidDecimalPlaces('10', 7)).toBe(true)
    expect(hasValidDecimalPlaces('$1.23', 2)).toBe(true)
    expect(hasValidDecimalPlaces('$1.234', 2)).toBe(false)
  })
})
