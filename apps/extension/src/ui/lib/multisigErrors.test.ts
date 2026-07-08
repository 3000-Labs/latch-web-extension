import { describe, expect, it } from 'vitest'

import { formatMultisigInviteError, formatMultisigProposalError } from './multisigErrors'

describe('multisigErrors', () => {
  it('maps expired invite errors to friendly copy', () => {
    expect(formatMultisigInviteError('token expired')).toMatch(/expired or is no longer valid/)
  })

  it('maps stale proposal errors to refresh guidance', () => {
    expect(formatMultisigProposalError('simulation stale')).toMatch(/Refresh simulation/)
  })
})
