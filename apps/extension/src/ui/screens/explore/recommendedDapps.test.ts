import { describe, expect, it, vi } from 'vitest'

vi.mock('url:../../../../assets/brand/latch-logo.svg', () => ({
  default: 'latch-logo.svg',
}))

import { RECOMMENDED_DAPPS } from './recommendedDapps'

describe('RECOMMENDED_DAPPS', () => {
  it('curates more than the single placeholder dApp', () => {
    expect(RECOMMENDED_DAPPS.length).toBeGreaterThan(1)
  })

  it('keeps ids unique and stable', () => {
    const ids = RECOMMENDED_DAPPS.map((dapp) => dapp.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('has non-empty names and descriptions', () => {
    for (const dapp of RECOMMENDED_DAPPS) {
      expect(dapp.name.trim().length).toBeGreaterThan(0)
      expect(dapp.description.trim().length).toBeGreaterThan(0)
    }
  })

  it('only lists https destinations that open safely', () => {
    for (const dapp of RECOMMENDED_DAPPS) {
      const parsed = new URL(dapp.url)
      expect(parsed.protocol).toBe('https:')
    }
  })

  it('marks the icon as optional for dApps without bundled assets', () => {
    expect(RECOMMENDED_DAPPS.some((dapp) => dapp.iconUrl === undefined)).toBe(true)
  })
})
