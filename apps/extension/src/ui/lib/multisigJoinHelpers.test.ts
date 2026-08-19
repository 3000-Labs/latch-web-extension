import { describe, expect, it } from 'vitest'

import type { StoredAccount } from '@latch/types'

import {
  draftHasMemberForStoredAccount,
  findDraftMemberForStoredAccount,
  isDuplicateMultisigMemberError,
} from '../../lib/multisigMemberMatch'

const account = {
  id: 'a1',
  mode: 'passkey',
  passkeyCredentialId: 'cred-abc',
  passkeyKeyDataHex: 'ABCD1234',
} as StoredAccount

describe('multisigJoinHelpers', () => {
  it('detects duplicate member API errors', () => {
    expect(
      isDuplicateMultisigMemberError(
        'duplicate multisig draft member: a webauthn signer with this key has already been added'
      )
    ).toBe(true)
    expect(isDuplicateMultisigMemberError('not found')).toBe(false)
  })

  it('matches draft members by credentialId or keyDataHex', () => {
    const members = [
      { id: 'm1', memberType: 'passkey', keyDataHex: 'abcd1234' },
      { id: 'm2', memberType: 'passkey', credentialId: 'cred-other' },
    ]
    expect(findDraftMemberForStoredAccount(members, account)?.id).toBe('m1')
    expect(draftHasMemberForStoredAccount(members, account)).toBe(true)

    const byCred = [
      { id: 'm3', memberType: 'passkey', credentialId: 'cred-abc' },
    ]
    expect(findDraftMemberForStoredAccount(byCred, account)?.id).toBe('m3')
  })
})
