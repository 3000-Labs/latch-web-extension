import { describe, expect, it } from 'vitest'

import type { MultisigDraftMember } from '@latch/types'

import { multisigDraftMembersEqual } from './multisigMembers'

describe('multisigDraftMembersEqual', () => {
  const member = (id: string, label: string): MultisigDraftMember => ({
    id,
    label,
    memberType: 'passkey',
  })

  it('returns true for identical member lists', () => {
    const a = [member('1', 'Alice'), member('2', 'Bob')]
    expect(multisigDraftMembersEqual(a, [...a])).toBe(true)
  })

  it('returns false when length or member data differs', () => {
    const a = [member('1', 'Alice')]
    const b = [member('1', 'Alice'), member('2', 'Bob')]
    const c = [member('1', 'Alicia')]
    expect(multisigDraftMembersEqual(a, b)).toBe(false)
    expect(multisigDraftMembersEqual(a, c)).toBe(false)
  })
})
