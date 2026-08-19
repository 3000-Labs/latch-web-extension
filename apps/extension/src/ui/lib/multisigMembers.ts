import type { MultisigDraftMember } from '@latch/types'

export function truncateStellarAddress(address: string): string {
  if (address.length <= 12) return address
  return `${address.slice(0, 4)}…${address.slice(-4)}`
}

export function memberDisplayAddress(member: MultisigDraftMember): string | undefined {
  if (member.gAddress) return truncateStellarAddress(member.gAddress)
  if (member.memberType === 'passkey') return 'Passkey signer'
  return undefined
}

export function memberTypeLabel(memberType?: string): string {
  switch (memberType) {
    case 'passkey':
      return 'Passkey'
    case 'seed':
    case 'delegated':
      return 'Address'
    default:
      return 'Owner'
  }
}

export function draftMemberCount(args: {
  members?: MultisigDraftMember[]
  validMemberCount?: number
}): number {
  return args.validMemberCount ?? args.members?.length ?? 0
}

function memberStableKey(member: MultisigDraftMember): string {
  return [
    member.id ?? '',
    member.memberType ?? '',
    member.credentialId ?? '',
    member.gAddress ?? '',
    member.label ?? '',
  ].join(':')
}

/** Shallow compare for poll updates — avoids re-renders when nothing changed. */
export function multisigDraftMembersEqual(
  a: MultisigDraftMember[],
  b: MultisigDraftMember[]
): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (memberStableKey(a[i]) !== memberStableKey(b[i])) return false
  }
  return true
}
