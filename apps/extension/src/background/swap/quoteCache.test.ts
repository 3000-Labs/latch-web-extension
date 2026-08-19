import { describe, expect, it, vi } from 'vitest'

import { getOrCreateQuote, quoteCacheKey } from './quoteCache'

describe('quoteCacheKey', () => {
  it('sorts keys deterministically', () => {
    expect(quoteCacheKey({ b: '2', a: '1' })).toBe('a=1|b=2')
  })
})

describe('getOrCreateQuote', () => {
  it('dedupes in-flight requests', async () => {
    const factory = vi.fn(async () => 42)
    const [a, b] = await Promise.all([
      getOrCreateQuote('k1', factory),
      getOrCreateQuote('k1', factory),
    ])
    expect(a).toBe(42)
    expect(b).toBe(42)
    expect(factory).toHaveBeenCalledTimes(1)
  })
})
