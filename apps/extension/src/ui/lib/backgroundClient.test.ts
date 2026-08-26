import { describe, expect, it } from 'vitest'

import { formatOperationError } from './backgroundClient'

describe('formatOperationError', () => {
  it('uses safe send copy for generic internal failures', () => {
    expect(
      formatOperationError(
        { code: 'INTERNAL_ERROR', message: 'internal error', status: 500 },
        'send'
      )
    ).toMatch(/send could not be completed/i)
  })

  it('uses safe swap copy for generic internal failures', () => {
    expect(
      formatOperationError(
        { code: 'internal_error', message: 'internal error', status: 500 },
        'swap'
      )
    ).toMatch(/swap could not be completed/i)
  })

  it('preserves a useful non-generic error message', () => {
    expect(formatOperationError({ code: 'timeout', message: 'timed out' }, 'send')).toMatch(
      /timed out/i
    )
  })
})