import type { MultisigDraft, MultisigDraftMember } from '@latch/types'

export {
  draftHasMemberForStoredAccount,
  findDraftMemberForStoredAccount,
  isDuplicateMultisigMemberError,
} from '../../lib/multisigMemberMatch'

export function findDraftMemberByCredentialId(
  draft: MultisigDraft | null | undefined,
  credentialId: string
): MultisigDraftMember | undefined {
  const id = credentialId.trim()
  if (!id) return undefined
  return draft?.members?.find((m) => m.credentialId?.trim() === id)
}

export function walletNameFromJoinPreview(
  preview:
    | MultisigDraft
    | {
        draft?: MultisigDraft | { walletName?: string; label?: string; name?: string } | null
        members?: MultisigDraftMember[]
        walletName?: string
        label?: string
      }
    | null
    | undefined,
  fallback = 'Multisig wallet'
): string {
  if (!preview) return fallback
  const nested =
    'draft' in preview && preview.draft
      ? preview.draft
      : (preview as MultisigDraft | { walletName?: string; label?: string; name?: string })
  const fromNested =
    (nested as { walletName?: string }).walletName?.trim() ||
    (nested as { label?: string }).label?.trim() ||
    (nested as { name?: string }).name?.trim()
  if (fromNested) return fromNested
  const top =
    (preview as { walletName?: string }).walletName?.trim() ||
    (preview as { label?: string }).label?.trim()
  return top || fallback
}
