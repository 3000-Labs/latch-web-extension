import type { MultisigDraft, MultisigJoinPreviewResponse } from '@latch/types'

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
