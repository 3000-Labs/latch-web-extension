import type { MultisigDraftMember, StoredAccount } from '@latch/types'

export function isDuplicateMultisigMemberError(message: string): boolean {
  return message.toLowerCase().includes('duplicate multisig draft member')
}

export function passkeyCredentialIdsFromAccounts(accounts: StoredAccount[]): Set<string> {
  const ids = new Set<string>()
  for (const account of accounts) {
    const id = account.passkeyCredentialId?.trim()
    if (id) ids.add(id)
  }
  return ids
}

export function passkeyKeyDataHexesFromAccounts(accounts: StoredAccount[]): Set<string> {
  const hexes = new Set<string>()
  for (const account of accounts) {
    const hex = account.passkeyKeyDataHex?.trim().toLowerCase()
    if (hex) hexes.add(hex)
  }
  return hexes
}

export function findDraftMemberForStoredAccount(
  members: MultisigDraftMember[] | undefined,
  account: StoredAccount
): MultisigDraftMember | undefined {
  const credId = account.passkeyCredentialId?.trim()
  const keyHex = account.passkeyKeyDataHex?.trim().toLowerCase()
  if (!credId && !keyHex) return undefined
  return members?.find((m) => {
    if (credId && m.credentialId?.trim() === credId) return true
    if (keyHex && m.keyDataHex?.trim().toLowerCase() === keyHex) return true
    return false
  })
}

export function findDraftMemberByCredentialId(
  members: MultisigDraftMember[] | undefined,
  credentialId: string | undefined
): MultisigDraftMember | undefined {
  const id = credentialId?.trim()
  if (!id) return undefined
  return members?.find((m) => m.credentialId?.trim() === id)
}

export function findDraftMemberById(
  members: MultisigDraftMember[] | undefined,
  memberId: string | undefined
): MultisigDraftMember | undefined {
  const id = memberId?.trim()
  if (!id) return undefined
  return members?.find((m) => m.id === id)
}

export function findDraftMemberForDelegatedAccount(
  members: MultisigDraftMember[] | undefined,
  account: StoredAccount
): MultisigDraftMember | undefined {
  const gAddress = account.gAddress?.trim()
  if (!gAddress) return undefined
  if (account.mode !== 'mnemonic') return undefined
  return members?.find((m) => m.gAddress?.trim() === gAddress)
}

export function findDraftMemberForUser(
  members: MultisigDraftMember[] | undefined,
  localAccounts: StoredAccount[]
): { member: MultisigDraftMember; account: StoredAccount } | undefined {
  for (const account of localAccounts) {
    if (account.mode === 'passkey') {
      const member = findDraftMemberForStoredAccount(members, account)
      if (member) return { member, account }
      continue
    }
    if (account.mode === 'mnemonic') {
      const member = findDraftMemberForDelegatedAccount(members, account)
      if (member) return { member, account }
    }
  }
  return undefined
}

/** Resolve the caller's draft membership using local accounts plus join-invite hints. */
export function resolveDraftMembership(
  members: MultisigDraftMember[] | undefined,
  localAccounts: StoredAccount[],
  hints?: { passkeyCredentialId?: string; multisigMemberId?: string }
): { member: MultisigDraftMember; account?: StoredAccount } | undefined {
  const byMemberId = findDraftMemberById(members, hints?.multisigMemberId)
  if (byMemberId) {
    const account = localAccounts.find((a) => findDraftMemberForStoredAccount([byMemberId], a))
    return { member: byMemberId, account }
  }

  const byCredential = findDraftMemberByCredentialId(members, hints?.passkeyCredentialId)
  if (byCredential) {
    const account = localAccounts.find((a) => findDraftMemberForStoredAccount([byCredential], a))
    return { member: byCredential, account }
  }

  const passkeyOrDelegated = findDraftMemberForUser(members, localAccounts)
  if (passkeyOrDelegated) {
    return { member: passkeyOrDelegated.member, account: passkeyOrDelegated.account }
  }

  return undefined
}

export function draftHasMemberForStoredAccount(
  members: MultisigDraftMember[] | undefined,
  account: StoredAccount
): boolean {
  return Boolean(findDraftMemberForStoredAccount(members, account))
}

export function findMemberIdForUser(
  members: MultisigDraftMember[] | undefined,
  localAccounts: StoredAccount[],
  inviteMemberId?: string
): string | undefined {
  const direct = inviteMemberId?.trim()
  if (direct && members?.some((m) => m.id === direct)) return direct
  return findDraftMemberForUser(members, localAccounts)?.member.id
}
