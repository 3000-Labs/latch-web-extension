import { describe, expect, it } from 'vitest'

import { humanAmountStringToRawUnits } from './amountRaw'

describe('humanAmountStringToRawUnits', () => {
  it('parses integer human string', () => {
    expect(humanAmountStringToRawUnits('10', 7)).toBe(100_000_000n)
  })

  it('parses fractional without float loss for large values', () => {
    expect(humanAmountStringToRawUnits('123456789.0000001', 7)).toBe(1234567890000001n)
  })

  it('respects decimals padding', () => {
    expect(humanAmountStringToRawUnits('0.0000001', 7)).toBe(1n)
  })
})
