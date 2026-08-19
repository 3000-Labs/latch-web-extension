import { describe, expect, it } from 'vitest'

import { applySlippageMin, humanToRaw, rawToHuman, rawToNumber } from './amounts'

describe('humanToRaw', () => {
  it('converts XLM decimals', () => {
    expect(humanToRaw('1', 7)).toBe('10000000')
    expect(humanToRaw('0.5', 7)).toBe('5000000')
    expect(humanToRaw('1,000.25', 7)).toBe('10002500000')
  })
})

describe('rawToHuman', () => {
  it('formats stroops to human', () => {
    expect(rawToHuman('10000000', 7)).toBe('1')
    expect(rawToHuman('1500000', 7)).toBe('0.15')
  })

  it('coerces numeric raw amounts from JSON APIs', () => {
    expect(rawToHuman(10000000 as unknown as string, 7)).toBe('1')
  })
})

describe('rawToNumber', () => {
  it('parses raw to float', () => {
    expect(rawToNumber('10000000', 7)).toBe(1)
  })

  it('coerces numeric raw amounts', () => {
    expect(rawToNumber(5000000 as unknown as string, 7)).toBe(0.5)
  })
})

describe('applySlippageMin', () => {
  it('floors output with slippage bps', () => {
    expect(applySlippageMin('10000000', 50)).toBe('9950000')
    expect(applySlippageMin('10000000', 100)).toBe('9900000')
  })
})
