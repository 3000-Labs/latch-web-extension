import { describe, expect, it } from 'vitest'

import { normalizeJoinPreview, unwrapMultisigDraft } from './multisigNormalize'

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
})
