import { describe, expect, it } from 'vitest'

import { decisionToExternalSignResult } from './orchestrator'

const signRequest = {
  network: 'testnet' as const,
  smartAccountAddress: 'C' + 'A'.repeat(55),
  requestId: 'req-1',
  submit: true,
}

describe('decisionToExternalSignResult', () => {
  it('maps user reject to rejected', () => {
    const result = decisionToExternalSignResult(signRequest, { approved: false })
    expect(result).toMatchObject({
      status: 'rejected',
      code: 'user_rejected',
    })
  })

  it('maps confirm failure to error', () => {
    const result = decisionToExternalSignResult(signRequest, {
      approved: false,
      errorMessage: 'Passkey failed',
      errorCode: 'sign_failed',
    })
    expect(result).toMatchObject({
      status: 'error',
      code: 'sign_failed',
      message: 'Passkey failed',
      requestId: 'req-1',
    })
  })
})
