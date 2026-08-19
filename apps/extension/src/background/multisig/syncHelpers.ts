import type {
  ListMultisigAccountsResponse,
  MultisigAccount,
  MultisigDraft,
  MultisigDraftMember,
  MultisigPendingInvite,
  MultisigPredictResponse,
  MultisigSignerInitRequest,
  RegisterMultisigAccountRequest,
  StoredAccount,
} from '@latch/types'

import { BackendError } from '../api/client'
import {
  findDraftMemberForStoredAccount,
  findMemberIdForUser,
  isDuplicateMultisigMemberError,
} from '../../lib/multisigMemberMatch'
import { normalizeMultisigSignerInitForApi } from '../../lib/multisigSignerInit'

export function normalizeListMultisigAccountsResponse(
  raw: ListMultisigAccountsResponse | MultisigAccount[] | null | undefined
): MultisigAccount[] {
  if (!raw) return []
  if (Array.isArray(raw)) return raw
  if (Array.isArray(raw.accounts)) return raw.accounts
  const nested = (raw as Record<string, unknown>).data
  if (nested && typeof nested === 'object' && Array.isArray((nested as { accounts?: unknown }).accounts)) {
    return (nested as { accounts: MultisigAccount[] }).accounts
  }
  return []
}

export function draftMembersToSigners(members: MultisigDraftMember[]): MultisigSignerInitRequest[] {
  return members
    .filter((m) => Boolean(m.memberType?.trim()))
    .map((m) => {
      const memberType = m.memberType?.trim() ?? 'passkey'
      const type = memberType === 'seed' ? 'delegated' : memberType
      return normalizeMultisigSignerInitForApi({
        type,
        label: m.label,
        gAddress: m.gAddress,
        keyDataHex: m.keyDataHex,
      })
    })
}

export function draftMembersToRegisterMembers(
  members: MultisigDraftMember[],
  localAccounts: StoredAccount[]
): RegisterMultisigAccountRequest['members'] {
  return members
    .filter((m) => Boolean(m.memberType?.trim()))
    .map((m) => {
      const memberType = m.memberType?.trim() ?? 'passkey'
      const type = memberType === 'seed' ? 'delegated' : memberType
      let credentialId = m.credentialId?.trim()
      let keyDataHex = m.keyDataHex?.trim()
      if (type === 'passkey' && (!credentialId || !keyDataHex)) {
        const local = localAccounts.find(
          (a) =>
            a.mode === 'passkey' &&
            ((credentialId && a.passkeyCredentialId?.trim() === credentialId) ||
              (keyDataHex && a.passkeyKeyDataHex?.trim().toLowerCase() === keyDataHex.toLowerCase()) ||
              findDraftMemberForStoredAccount([m], a))
        )
        credentialId = credentialId ?? local?.passkeyCredentialId?.trim()
        keyDataHex = keyDataHex ?? local?.passkeyKeyDataHex?.trim()
      }
      return {
        type,
        label: m.label,
        gAddress: m.gAddress,
        credentialId,
        keyDataHex,
      }
    })
}

export function draftLooksDeployed(draft?: MultisigDraft | null, predict?: MultisigPredictResponse | null): boolean {
  if (predict?.alreadyDeployed) return true
  const status = draft?.status?.trim().toLowerCase()
  if (status === 'deployed' || status === 'live') return true
  return Boolean(draft?.smartAccountAddress?.trim())
}

export function predictAddress(
  draft?: MultisigDraft | null,
  predict?: MultisigPredictResponse | null,
  fallbackAddress?: string | null
): string | undefined {
  return (
    draft?.smartAccountAddress?.trim() ??
    predict?.smartAccountAddress?.trim() ??
    fallbackAddress?.trim() ??
    undefined
  )
}

export function predictSalt(
  draft?: MultisigDraft | null,
  predict?: MultisigPredictResponse | null,
  fallbackSaltHex?: string | null
): string | undefined {
  const fromDraft = (draft as { accountSaltHex?: string } | undefined)?.accountSaltHex?.trim()
  return fromDraft ?? predict?.accountSaltHex?.trim() ?? fallbackSaltHex?.trim() ?? undefined
}

export function matchPendingInviteForRemoteAccount(
  remote: MultisigAccount,
  invites: MultisigPendingInvite[],
  passkeyCredentialIds: Set<string>
): MultisigPendingInvite | undefined {
  const addr = remote.smartAccountAddress?.trim()
  const remoteMemberId = remote.memberId?.trim()

  return invites.find((invite) => {
    const inviteAddr = invite.smartAccountAddress?.trim()
    if (addr && inviteAddr && inviteAddr === addr) return true
    if (remoteMemberId && invite.multisigMemberId?.trim() === remoteMemberId) return true
    const cid = invite.passkeyCredentialId?.trim()
    return Boolean(cid && passkeyCredentialIds.has(cid))
  })
}

export function multisigLocalAccountNeedsUpdate(
  existing: StoredAccount,
  next: {
    label: string
    threshold?: number
    memberId?: string
    backendAccountId?: string
  }
): boolean {
  if (next.memberId && existing.multisigMemberId !== next.memberId) return true
  if (next.backendAccountId && existing.multisigBackendAccountId !== next.backendAccountId) return true
  if (next.threshold != null && existing.multisigThreshold !== next.threshold) return true
  if (next.label && existing.label !== next.label) return true
  return !existing.multisigMemberId && Boolean(next.memberId)
}

export function isRegisterDuplicateError(err: unknown): boolean {
  if (!(err instanceof BackendError)) return false
  if (err.status === 409) return true
  return isDuplicateMultisigMemberError(err.message)
}

export function resolveRemoteMemberId(
  remote: MultisigAccount,
  localAccounts: StoredAccount[],
  inviteMemberId?: string
): string | undefined {
  const direct = remote.memberId?.trim()
  if (direct) return direct
  const fromInvite = inviteMemberId?.trim()
  if (fromInvite) return fromInvite
  return findMemberIdForUser(remote.members, localAccounts)
}
