import { describe, expect, it } from 'vitest'

import type { MultisigDraftMember, StoredAccount } from '@latch/types'

import {
  findDraftMemberByCredentialId,
  findDraftMemberById,
  resolveDraftMembership,
} from './multisigMemberMatch'

describe('multisigMemberMatch', () => {
  const members: MultisigDraftMember[] = [
    { id: 'member-1', memberType: 'passkey', credentialId: 'cred-new', keyDataHex: 'aa' },
    { id: 'member-2', memberType: 'passkey', credentialId: 'cred-existing', keyDataHex: 'bb' },
    { id: 'member-3', memberType: 'seed', gAddress: 'GDELEGATED' },
  ]

  it('finds members by credential id and member id', () => {
    expect(findDraftMemberByCredentialId(members, 'cred-new')?.id).toBe('member-1')
    expect(findDraftMemberById(members, 'member-3')?.gAddress).toBe('GDELEGATED')
  })

  it('resolves membership from invite hints without a local passkey account', () => {
    const localAccounts = [] as StoredAccount[]
    const membership = resolveDraftMembership(members, localAccounts, {
      passkeyCredentialId: 'cred-new',
      multisigMemberId: 'member-1',
    })
    expect(membership?.member.id).toBe('member-1')
    expect(membership?.account).toBeUndefined()
  })

  it('resolves delegated membership from a local freighter account', () => {
    const localAccounts = [
      {
        id: 'a1',
        mode: 'freighter',
        smartAccountAddress: 'C1',
        gAddress: 'GDELEGATED',
        createdAt: 1,
      },
    ] as StoredAccount[]
    const membership = resolveDraftMembership(members, localAccounts)
    expect(membership?.member.id).toBe('member-3')
    expect(membership?.account?.id).toBe('a1')
  })
})
