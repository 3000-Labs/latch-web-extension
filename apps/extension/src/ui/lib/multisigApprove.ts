import type {
  MultisigApproveWebauthnRequest,
  MultisigProposalDetail,
  StoredAccount,
} from '@latch/types'

import { startAuthentication } from '@simplewebauthn/browser'

import { friendlyError, sendToBackground } from './backgroundClient'
import {
  assertPasskeyAssertionMatchesAuthDigest,
  buildPasskeySigDataXdrFromAssertion,
  passkeyAuthenticationOptionsForAuthDigest,
  prepareAuthenticationOptionsForGet,
} from '../webauthn/passkey'
import { openPasskeyBridgeAndWait } from '../webauthn/passkeyBridge'

async function runPasskeyAuth(
  surface: 'popup' | 'sidepanel',
  optionsJSON: unknown
): Promise<Awaited<ReturnType<typeof startAuthentication>>> {
  if (surface === 'sidepanel') {
    return (await openPasskeyBridgeAndWait({
      mode: 'authentication',
      optionsJSON,
    })) as Awaited<ReturnType<typeof startAuthentication>>
  }
  return await startAuthentication({
    optionsJSON: prepareAuthenticationOptionsForGet(optionsJSON),
  } as Parameters<typeof startAuthentication>[0])
}

export async function approveMultisigProposalWithPasskey(args: {
  proposal: MultisigProposalDetail
  activeAccount: StoredAccount
  accounts: StoredAccount[]
  surface: 'popup' | 'sidepanel'
}): Promise<MultisigProposalDetail> {
  const { proposal, activeAccount, accounts, surface } = args
  const authDigestHex = proposal.authDigestHex?.trim()
  const memberId = activeAccount.multisigMemberId?.trim() || proposal.memberId?.trim()
  if (!authDigestHex) throw new Error('Proposal is missing auth digest.')
  if (!memberId) throw new Error('Missing multisig member id for this account.')
  if (!proposal.id) throw new Error('Missing proposal id.')

  const linkedPasskey =
    accounts.find(
      (a) =>
        a.mode === 'passkey' &&
        a.passkeyCredentialId?.trim() &&
        (a.id === activeAccount.id ||
          a.smartAccountAddress === activeAccount.smartAccountAddress ||
          Boolean(a.passkeyKeyDataHex?.trim()))
    ) ?? accounts.find((a) => a.mode === 'passkey' && a.passkeyCredentialId?.trim())

  const credentialId =
    activeAccount.passkeyCredentialId?.trim() ?? linkedPasskey?.passkeyCredentialId?.trim()
  if (!credentialId) {
    throw new Error('No passkey is available to approve this proposal.')
  }

  const optionsJSON = passkeyAuthenticationOptionsForAuthDigest({
    authDigestHex,
    credentialId,
  })

  const assertion = await runPasskeyAuth(surface, optionsJSON)
  assertPasskeyAssertionMatchesAuthDigest(assertion, authDigestHex)
  const sigDataXdrHex = buildPasskeySigDataXdrFromAssertion(assertion)

  const res = await sendToBackground<
    MultisigApproveWebauthnRequest,
    MultisigProposalDetail
  >({
    type: 'MULTISIG_APPROVE_WEBAUTHN',
    payload: {
      proposalId: proposal.id,
      memberId,
      sigDataXdrHex,
    },
  })

  if (!res.ok) throw new Error(friendlyError(res.error))
  return res.data!
}

export function proposalNeedsMyApproval(
  proposal: MultisigProposalDetail,
  memberId: string | undefined
): boolean {
  if (!memberId || proposal.status === 'executed') return false
  const approvals = proposal.approvals ?? []
  return !approvals.some((a) => a.memberId === memberId)
}

export function proposalReadyToExecute(proposal: MultisigProposalDetail): boolean {
  const threshold = proposal.threshold ?? 0
  const count = proposal.approvalCount ?? proposal.approvals?.length ?? 0
  const status = proposal.status
  if (status === 'executed' || status === 'submitted' || status === 'cancelled') return false
  return count >= threshold
}
