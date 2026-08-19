import type {
  MultisigAccount,
  MultisigAccountMember,
  MultisigDraft,
  MultisigJoinPreviewResponse,
  MultisigProposalDetail,
  MultisigProposalApproval,
} from '@latch/types'

/** Backend draft endpoints often return `{ draft: MultisigDraft }` instead of a bare draft. */
export function unwrapMultisigDraft(data: unknown): MultisigDraft | null {
  if (!data || typeof data !== 'object') return null
  const record = data as Record<string, unknown>
  if (record.draft && typeof record.draft === 'object') {
    return record.draft as MultisigDraft
  }
  if (typeof record.id === 'string') {
    return record as MultisigDraft
  }
  return null
}

export function normalizeJoinPreview(raw: unknown): MultisigJoinPreviewResponse {
  const draft = unwrapMultisigDraft(raw)
  const top = (raw && typeof raw === 'object' ? raw : {}) as MultisigJoinPreviewResponse
  const members = top.members ?? draft?.members ?? []
  const threshold = top.threshold ?? draft?.threshold
  const validMemberCount = draft?.validMemberCount ?? members.length

  return {
    ...top,
    draft: draft ?? top.draft,
    members,
    threshold,
    validMemberCount,
  }
}

/**
 * Proposal detail endpoints return a nested shape:
 * `{ account, proposal, members, approvals }` (see backend reference tree),
 * while the extension UI expects a flat `MultisigProposalDetail`.
 */
export function normalizeMultisigProposalDetail(raw: unknown): MultisigProposalDetail {
  if (!raw || typeof raw !== 'object') return raw as MultisigProposalDetail
  const rec = raw as Record<string, unknown>

  const proposal = (rec.proposal && typeof rec.proposal === 'object'
    ? (rec.proposal as Record<string, unknown>)
    : rec) as MultisigProposalDetail

  const account = (rec.account && typeof rec.account === 'object'
    ? (rec.account as Record<string, unknown>)
    : {}) as MultisigAccount

  const members =
    (Array.isArray(rec.members) ? (rec.members as MultisigAccountMember[]) : undefined) ??
    (Array.isArray(proposal.members) ? (proposal.members as MultisigAccountMember[]) : undefined)

  const approvals =
    (Array.isArray(rec.approvals) ? (rec.approvals as MultisigProposalApproval[]) : undefined) ??
    (Array.isArray(proposal.approvals) ? (proposal.approvals as MultisigProposalApproval[]) : undefined)

  // Flatten account context (threshold/address) onto proposal for UI convenience.
  return {
    ...proposal,
    smartAccountAddress:
      proposal.smartAccountAddress?.trim() || account.smartAccountAddress?.trim() || undefined,
    threshold: proposal.threshold ?? account.threshold,
    memberId: proposal.memberId ?? (account as any).memberId ?? (rec.memberId as string | undefined),
    members,
    approvals,
    // Prefer nested proposal authDigestHex if present.
    authDigestHex: proposal.authDigestHex ?? (rec.authDigestHex as string | undefined),
    txXdr: proposal.txXdr ?? (rec.txXdr as string | undefined),
    authEntryXdr: proposal.authEntryXdr ?? (rec.authEntryXdr as string | undefined),
    validUntilLedger: proposal.validUntilLedger ?? (rec.validUntilLedger as number | undefined),
  }
}
