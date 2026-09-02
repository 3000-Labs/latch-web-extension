import { describe, expect, it } from 'vitest'

import { isCurrentRequest, shouldApplyBackgroundResult } from './requestSession'

describe('requestSession', () => {
  it('isCurrentRequest matches only the active id', () => {
    expect(isCurrentRequest('a', 'a')).toBe(true)
    expect(isCurrentRequest('a', 'b')).toBe(false)
    expect(isCurrentRequest(null, 'a')).toBe(false)
  })

  it('shouldApplyBackgroundResult rejects mismatched ids (late response)', () => {
    expect(
      shouldApplyBackgroundResult({
        currentId: 'b',
        responseId: 'a',
      })
    ).toBe(false)
  })

  it('shouldApplyBackgroundResult rejects cancelled errors', () => {
    expect(
      shouldApplyBackgroundResult({
        currentId: 'a',
        responseId: 'a',
        error: { message: 'Request cancelled', code: 'cancelled' },
      })
    ).toBe(false)
  })

  it('shouldApplyBackgroundResult accepts matching successful responses', () => {
    expect(
      shouldApplyBackgroundResult({
        currentId: 'a',
        responseId: 'a',
      })
    ).toBe(true)
  })
})
