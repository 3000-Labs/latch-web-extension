import { describe, expect, it } from 'vitest'

import type { MultisigProposalDetail, StoredAccount } from '@latch/types'

import {
  findDelegatedSigningAccount,
  findProposalMember,
  isMultisigDelegatedMember,
  isMultisigPasskeyMember,
  peekMultisigApprovalSigner,
  resolveMultisigApprovalSigner,
} from './multisigApprove'

const multisigAccount: StoredAccount = {
  id: 'ms-1',
  mode: 'multisig',
  smartAccountAddress: 'CABC',
  multisigMemberId: 'member-delegated',
}

const freighterAccount: StoredAccount = {
  id: 'f-1',
  mode: 'freighter',
  gAddress: 'GDELEGATED',
}

const passkeyAccount: StoredAccount = {
  id: 'p-1',
  mode: 'passkey',
  passkeyCredentialId: 'cred-1',
  passkeyKeyDataHex: 'abcd',
}

const delegatedProposal: MultisigProposalDetail = {
  id: 'prop-1',
  members: [
    { id: 'member-delegated', memberType: 'delegated', gAddress: 'GDELEGATED' },
    { id: 'member-passkey', memberType: 'webauthn', credentialId: 'cred-1' },
  ],
}

describe('multisigApprove signer routing', () => {
  it('detects delegated members by type and gAddress', () => {
    expect(isMultisigDelegatedMember({ id: 'm1', memberType: 'delegated' })).toBe(true)
    expect(isMultisigDelegatedMember({ id: 'm2', memberType: 'seed' })).toBe(true)
    expect(isMultisigDelegatedMember({ id: 'm3', gAddress: 'GXYZ' })).toBe(true)
    expect(isMultisigPasskeyMember({ id: 'm4', memberType: 'webauthn' })).toBe(true)
    expect(isMultisigPasskeyMember({ id: 'm5', memberType: 'delegated' })).toBe(false)
  })

  it('routes delegated members to freighter/mnemonic signing accounts', () => {
    const resolved = resolveMultisigApprovalSigner({
      proposal: delegatedProposal,
      activeAccount: multisigAccount,
      accounts: [multisigAccount, freighterAccount],
    })
    expect(resolved.kind).toBe('delegated')
    expect(resolved.signingAccount?.id).toBe('f-1')
  })

  it('routes passkey members to passkey approval', () => {
    const resolved = resolveMultisigApprovalSigner({
      proposal: delegatedProposal,
      activeAccount: { ...multisigAccount, multisigMemberId: 'member-passkey' },
      accounts: [multisigAccount, passkeyAccount],
    })
    expect(resolved.kind).toBe('passkey')
  })

  it('peekMultisigApprovalSigner returns delegated labels without throwing', () => {
    const peek = peekMultisigApprovalSigner({
      proposal: delegatedProposal,
      activeAccount: multisigAccount,
      accounts: [multisigAccount, freighterAccount],
    })
    expect(peek?.kind).toBe('delegated')
    expect(peek?.approveLabel).toBe('Approve with Freighter')
  })

  it('findProposalMember and findDelegatedSigningAccount match expected rows', () => {
    expect(findProposalMember(delegatedProposal, 'member-delegated')?.gAddress).toBe('GDELEGATED')
    expect(findDelegatedSigningAccount([freighterAccount], 'GDELEGATED')?.id).toBe('f-1')
  })
})
