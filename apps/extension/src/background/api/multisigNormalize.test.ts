import { describe, expect, it } from 'vitest'

import {
  normalizeJoinPreview,
  normalizeMultisigProposalDetail,
  unwrapMultisigDraft,
} from './multisigNormalize'

describe('multisigNormalize', () => {
  it('unwrapMultisigDraft reads nested draft payload', () => {
    const draft = {
      id: 'draft-1',
      members: [{ id: 'm1', label: 'Levi', memberType: 'delegated' }],
      validMemberCount: 1,
      threshold: 2,
    }
    expect(unwrapMultisigDraft({ draft })).toEqual(draft)
  })

  it('normalizeJoinPreview surfaces members and validMemberCount', () => {
    const normalized = normalizeJoinPreview({
      draft: {
        id: 'draft-1',
        threshold: 2,
        validMemberCount: 1,
        members: [{ id: 'm1', label: 'Levi', memberType: 'delegated' }],
      },
    })
    expect(normalized.members).toHaveLength(1)
    expect(normalized.validMemberCount).toBe(1)
    expect(normalized.threshold).toBe(2)
  })

  it('normalizeMultisigProposalDetail flattens nested proposal responses', () => {
    const normalized = normalizeMultisigProposalDetail({
      account: { smartAccountAddress: 'CABC', threshold: 2, memberId: 'mem-1' },
      proposal: { id: 'p1', status: 'pending', authDigestHex: 'deadbeef', validUntilLedger: 123 },
      members: [{ id: 'm1', label: 'A', memberType: 'webauthn' }],
      approvals: [{ id: 'a1', memberId: 'm1' }],
    })
    expect(normalized.id).toBe('p1')
    expect(normalized.authDigestHex).toBe('deadbeef')
    expect(normalized.smartAccountAddress).toBe('CABC')
    expect(normalized.threshold).toBe(2)
    expect(normalized.memberId).toBe('mem-1')
    expect(normalized.members).toHaveLength(1)
    expect(normalized.approvals).toHaveLength(1)
  })
})
