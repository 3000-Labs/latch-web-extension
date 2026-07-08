import { describe, expect, it } from 'vitest'

import { parseApiError } from './errors'

describe('api/errors', () => {
  it('parses webapp flat error shape', () => {
    expect(parseApiError(409, { error: 'Context rule required', code: 'NO_CONTEXT_RULE' })).toEqual({
      message: 'Context rule required',
      code: 'NO_CONTEXT_RULE',
    })
  })

  it('parses v1 nested error shape', () => {
    expect(
      parseApiError(400, {
        error: { code: 'INVALID_TOKENS', message: 'tokens query param required' },
      })
    ).toEqual({
      message: 'tokens query param required',
      code: 'INVALID_TOKENS',
    })
  })

  it('falls back when body is empty', () => {
    expect(parseApiError(500, undefined)).toEqual({ message: 'Request failed: 500' })
  })
})
