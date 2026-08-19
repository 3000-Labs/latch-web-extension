import { describe, expect, it } from 'vitest'

import type {
  MultisigAccount,
  MultisigDraftMember,
  MultisigPendingInvite,
  StoredAccount,
} from '@latch/types'

import {
  draftMembersToSigners,
  matchPendingInviteForRemoteAccount,
  multisigLocalAccountNeedsUpdate,
  normalizeListMultisigAccountsResponse,
  predictAddress,
  resolveRemoteMemberId,
} from './syncHelpers'

describe('multisig syncHelpers', () => {
  it('normalizes list accounts response shapes', () => {
    const accounts: MultisigAccount[] = [{ smartAccountAddress: 'CABC' }]
    expect(normalizeListMultisigAccountsResponse({ accounts })).toEqual(accounts)
    expect(normalizeListMultisigAccountsResponse({ data: { accounts } })).toEqual(accounts)
    expect(normalizeListMultisigAccountsResponse(accounts)).toEqual(accounts)
  })

  it('maps draft members to signer init requests', () => {
    const members: MultisigDraftMember[] = [
      { id: 'm1', memberType: 'passkey', keyDataHex: 'abcd' },
      { id: 'm2', memberType: 'seed', gAddress: 'GXYZ' },
    ]
    expect(draftMembersToSigners(members)).toEqual([
      { type: 'webauthn', label: undefined, keyDataHex: 'abcd' },
      { type: 'delegated', label: undefined, gAddress: 'GXYZ' },
    ])
  })

  it('resolves remote member id from local passkey key data', () => {
    const localAccounts = [
      {
        id: 'a1',
        mode: 'passkey',
        smartAccountAddress: 'C1',
        passkeyKeyDataHex: 'ABCD',
        createdAt: 1,
      },
    ] as StoredAccount[]
    const remote: MultisigAccount = {
      smartAccountAddress: 'CMULTI',
      members: [{ id: 'member-1', memberType: 'passkey', keyDataHex: 'abcd' }],
    }
    expect(resolveRemoteMemberId(remote, localAccounts)).toBe('member-1')
  })

  it('prefers backend memberId on listed accounts', () => {
    const remote: MultisigAccount = {
      smartAccountAddress: 'CMULTI',
      memberId: 'session-member-id',
      members: [{ id: 'other-member', memberType: 'passkey', keyDataHex: 'abcd' }],
    }
    expect(resolveRemoteMemberId(remote, [])).toBe('session-member-id')
  })

  it('predictAddress falls back to cached invite address', () => {
    expect(predictAddress(null, null, 'CCACHED')).toBe('CCACHED')
  })

  it('matches pending invites to listed remote accounts', () => {
    const invites: MultisigPendingInvite[] = [
      {
        token: 'tok-1',
        joinedAt: 1,
        smartAccountAddress: 'CMULTI',
        multisigMemberId: 'member-1',
      },
    ]
    const remote: MultisigAccount = {
      smartAccountAddress: 'CMULTI',
      memberId: 'member-1',
    }
    expect(matchPendingInviteForRemoteAccount(remote, invites, new Set())?.token).toBe('tok-1')
  })

  it('detects when local multisig metadata needs refresh', () => {
    const existing = {
      id: 'm1',
      mode: 'multisig',
      smartAccountAddress: 'CMULTI',
      label: 'Old name',
      createdAt: 1,
    } as StoredAccount
    expect(
      multisigLocalAccountNeedsUpdate(existing, {
        label: 'Family vault',
        memberId: 'member-2',
        threshold: 2,
        backendAccountId: 'backend-1',
      })
    ).toBe(true)
  })
})
