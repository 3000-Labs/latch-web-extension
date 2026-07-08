import type {
  AccountMode,
  DappPermission,
  GetAccountsResponse,
  MultisigDraftMeta,
  MultisigPendingInvite,
  PendingDappRequest,
  StoredAccount,
} from '@latch/types'

import { clearAllMnemonicVaultRecords } from './mnemonicVault'

const STORAGE_KEYS = {
  setupState: 'latch.setupState',
  legacyAccountPublicKey: 'latch.accountPublicKey',
  accounts: 'latch.accounts',
  activeAccountId: 'latch.activeAccountId',
  dappPermissions: 'latch.dappPermissions',
  pendingDappRequests: 'latch.pendingDappRequests',
  multisigPendingInvites: 'latch.multisigPendingInvites',
  multisigDraftMeta: 'latch.multisigDraftMeta',
  multisigProposalsBannerDismissed: 'latch.multisigProposalsBannerDismissed',
} as const

type DappPermissionsStore = Record<string, DappPermission[] | undefined>

export function storageKeys() {
  return STORAGE_KEYS
}

export async function getAccounts(): Promise<GetAccountsResponse> {
  const res = await chrome.storage.local.get([STORAGE_KEYS.accounts, STORAGE_KEYS.activeAccountId])
  const accounts = (res[STORAGE_KEYS.accounts] as StoredAccount[] | undefined) ?? []
  const activeAccountId = res[STORAGE_KEYS.activeAccountId] as string | undefined
  return { accounts, activeAccountId }
}

export async function setActiveAccount(accountId: string): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.activeAccountId]: accountId })
}

function newId() {
  return crypto.randomUUID()
}

export async function upsertAccount(
  input: Omit<StoredAccount, 'id' | 'createdAt'> & Partial<Pick<StoredAccount, 'id' | 'createdAt'>>
) {
  const { accounts, activeAccountId } = await getAccounts()

  const now = Date.now()
  const id = input.id ?? newId()
  const createdAt = input.createdAt ?? now

  const next: StoredAccount = { ...input, id, createdAt }
  const existingIdx = accounts.findIndex((a) => a.id === id)
  const nextAccounts =
    existingIdx >= 0 ? accounts.map((a, i) => (i === existingIdx ? next : a)) : [...accounts, next]

  await chrome.storage.local.set({
    [STORAGE_KEYS.accounts]: nextAccounts,
    [STORAGE_KEYS.activeAccountId]: activeAccountId ?? id,
  })

  return { account: next, activeAccountId: activeAccountId ?? id }
}

export async function createAccount(params: {
  mode: AccountMode
  smartAccountAddress: string
  gAddress?: string
  phantomPublicKeyHex?: string
  passkeyCredentialId?: string
  passkeyKeyDataHex?: string
  label?: string
  multisigThreshold?: number
  multisigMemberId?: string
  multisigBackendAccountId?: string
  cosignWckRefId?: string
  cosignBlindSignerId?: string
  cosignLinkedAccountId?: string
  multisigAccountSaltHex?: string
  multisigMembersSnapshot?:
    | import('@latch/types').MultisigDraftMember[]
    | import('@latch/types').CosignMemberInit[]
}) {
  const { accounts } = await getAccounts()

  let existing: StoredAccount | undefined
  if (params.mode === 'passkey') {
    existing = accounts.find((a) => {
      if (a.mode !== 'passkey') return false
      if (params.passkeyCredentialId && a.passkeyCredentialId === params.passkeyCredentialId)
        return true
      if (params.smartAccountAddress && a.smartAccountAddress === params.smartAccountAddress)
        return true
      return false
    })
  } else if (params.mode === 'mnemonic' || params.mode === 'freighter') {
    existing = accounts.find((a) => {
      if (a.mode !== 'mnemonic' && a.mode !== 'freighter') return false
      if (params.gAddress && a.gAddress === params.gAddress) return true
      if (params.smartAccountAddress && a.smartAccountAddress === params.smartAccountAddress)
        return true
      return false
    })
  } else if (params.mode === 'phantom') {
    existing = accounts.find((a) => {
      if (a.mode !== 'phantom') return false
      if (params.phantomPublicKeyHex && a.phantomPublicKeyHex === params.phantomPublicKeyHex)
        return true
      if (params.smartAccountAddress && a.smartAccountAddress === params.smartAccountAddress)
        return true
      return false
    })
  } else if (params.mode === 'multisig') {
    existing = accounts.find(
      (a) =>
        a.mode === 'multisig' &&
        params.smartAccountAddress &&
        a.smartAccountAddress === params.smartAccountAddress
    )
  }

  return await upsertAccount({
    id: existing?.id,
    createdAt: existing?.createdAt,
    mode: params.mode,
    smartAccountAddress: params.smartAccountAddress,
    gAddress: params.gAddress,
    phantomPublicKeyHex: params.phantomPublicKeyHex,
    passkeyCredentialId: params.passkeyCredentialId,
    passkeyKeyDataHex: params.passkeyKeyDataHex ?? existing?.passkeyKeyDataHex,
    label: params.label ?? existing?.label,
    multisigThreshold: params.multisigThreshold ?? existing?.multisigThreshold,
    multisigMemberId: params.multisigMemberId ?? existing?.multisigMemberId,
    multisigBackendAccountId:
      params.multisigBackendAccountId ?? existing?.multisigBackendAccountId,
    cosignWckRefId: params.cosignWckRefId ?? existing?.cosignWckRefId,
    cosignBlindSignerId: params.cosignBlindSignerId ?? existing?.cosignBlindSignerId,
    cosignLinkedAccountId: params.cosignLinkedAccountId ?? existing?.cosignLinkedAccountId,
    multisigAccountSaltHex: params.multisigAccountSaltHex ?? existing?.multisigAccountSaltHex,
    multisigMembersSnapshot:
      params.multisigMembersSnapshot ?? existing?.multisigMembersSnapshot,
  })
}

export async function createMultisigAccount(params: {
  smartAccountAddress: string
  label?: string
  multisigThreshold?: number
  multisigMemberId?: string
  multisigBackendAccountId?: string
  cosignWckRefId?: string
  cosignBlindSignerId?: string
  cosignLinkedAccountId?: string
  multisigAccountSaltHex?: string
  multisigMembersSnapshot?:
    | import('@latch/types').MultisigDraftMember[]
    | import('@latch/types').CosignMemberInit[]
}) {
  return await createAccount({
    mode: 'multisig',
    ...params,
  })
}

export async function getMultisigPendingInvites(): Promise<MultisigPendingInvite[]> {
  const res = await chrome.storage.local.get([STORAGE_KEYS.multisigPendingInvites])
  return (res[STORAGE_KEYS.multisigPendingInvites] as MultisigPendingInvite[] | undefined) ?? []
}

export async function addMultisigPendingInvite(invite: MultisigPendingInvite): Promise<MultisigPendingInvite[]> {
  const current = await getMultisigPendingInvites()
  const filtered = current.filter((i) => i.token !== invite.token)
  const next = [...filtered, invite]
  await chrome.storage.local.set({ [STORAGE_KEYS.multisigPendingInvites]: next })
  return next
}

export async function upsertMultisigPendingInvite(
  token: string,
  patch: Partial<MultisigPendingInvite>
): Promise<MultisigPendingInvite[]> {
  const current = await getMultisigPendingInvites()
  const existing = current.find((i) => i.token === token)
  const invite: MultisigPendingInvite = {
    token,
    joinedAt: existing?.joinedAt ?? Date.now(),
    ...existing,
    ...patch,
  }
  return addMultisigPendingInvite(invite)
}

export async function removeMultisigPendingInvite(token: string): Promise<MultisigPendingInvite[]> {
  const current = await getMultisigPendingInvites()
  const next = current.filter((i) => i.token !== token)
  await chrome.storage.local.set({ [STORAGE_KEYS.multisigPendingInvites]: next })
  return next
}

export async function getMultisigDraftMeta(): Promise<MultisigDraftMeta | null> {
  const res = await chrome.storage.local.get([STORAGE_KEYS.multisigDraftMeta])
  return (res[STORAGE_KEYS.multisigDraftMeta] as MultisigDraftMeta | undefined) ?? null
}

export async function setMultisigDraftMeta(meta: MultisigDraftMeta): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.multisigDraftMeta]: meta })
}

export async function clearMultisigDraftMeta(): Promise<void> {
  await chrome.storage.local.remove([STORAGE_KEYS.multisigDraftMeta])
}

export async function getMultisigProposalsBannerDismissed(): Promise<string[]> {
  const res = await chrome.storage.local.get([STORAGE_KEYS.multisigProposalsBannerDismissed])
  return (res[STORAGE_KEYS.multisigProposalsBannerDismissed] as string[] | undefined) ?? []
}

export async function dismissMultisigProposalsBanner(accountId: string): Promise<string[]> {
  const current = await getMultisigProposalsBannerDismissed()
  if (current.includes(accountId)) return current
  const next = [...current, accountId]
  await chrome.storage.local.set({ [STORAGE_KEYS.multisigProposalsBannerDismissed]: next })
  return next
}

export async function renameAccount(args: { accountId: string; label?: string }) {
  const { accounts, activeAccountId } = await getAccounts()
  const nextAccounts = accounts.map((a) =>
    a.id === args.accountId ? { ...a, label: args.label } : a
  )
  await chrome.storage.local.set({
    [STORAGE_KEYS.accounts]: nextAccounts,
    [STORAGE_KEYS.activeAccountId]: activeAccountId,
  })
}

export async function getDappPermissions(origin: string): Promise<DappPermission[]> {
  const res = await chrome.storage.local.get([STORAGE_KEYS.dappPermissions])
  const store = (res[STORAGE_KEYS.dappPermissions] as DappPermissionsStore | undefined) ?? {}
  return store[origin] ?? []
}

export async function setDappPermissions(
  origin: string,
  allowed: DappPermission[]
): Promise<DappPermission[]> {
  const res = await chrome.storage.local.get([STORAGE_KEYS.dappPermissions])
  const store = (res[STORAGE_KEYS.dappPermissions] as DappPermissionsStore | undefined) ?? {}
  const next: DappPermissionsStore = { ...store, [origin]: allowed }
  await chrome.storage.local.set({ [STORAGE_KEYS.dappPermissions]: next })
  return allowed
}

export async function listPendingDappRequests(): Promise<PendingDappRequest[]> {
  const res = await chrome.storage.local.get([STORAGE_KEYS.pendingDappRequests])
  return (res[STORAGE_KEYS.pendingDappRequests] as PendingDappRequest[] | undefined) ?? []
}

export async function addPendingDappRequest(req: PendingDappRequest) {
  const current = await listPendingDappRequests()
  await chrome.storage.local.set({ [STORAGE_KEYS.pendingDappRequests]: [...current, req] })
}

export async function removePendingDappRequest(requestId: string) {
  const current = await listPendingDappRequests()
  await chrome.storage.local.set({
    [STORAGE_KEYS.pendingDappRequests]: current.filter((r) => r.id !== requestId),
  })
}

export async function clearSession() {
  await clearAllMnemonicVaultRecords()
  await chrome.storage.local.remove([
    STORAGE_KEYS.accounts,
    STORAGE_KEYS.activeAccountId,
    STORAGE_KEYS.setupState,
    STORAGE_KEYS.legacyAccountPublicKey,
    STORAGE_KEYS.dappPermissions,
    STORAGE_KEYS.pendingDappRequests,
  ])
}

export async function disconnectSessionForLogoutDev() {
  await chrome.storage.local.remove([
    STORAGE_KEYS.activeAccountId,
    STORAGE_KEYS.setupState,
    STORAGE_KEYS.legacyAccountPublicKey,
    STORAGE_KEYS.dappPermissions,
    STORAGE_KEYS.pendingDappRequests,
  ])
}

/**
 * Optional one-time migration: if legacy `latch.accountPublicKey` exists and no accounts are present,
 * create a placeholder account for UI continuity.
 */
export async function migrateLegacyPublicKeyIfNeeded() {
  const { accounts } = await getAccounts()
  if (accounts.length > 0) return

  const res = await chrome.storage.local.get([STORAGE_KEYS.legacyAccountPublicKey])
  const pk = res[STORAGE_KEYS.legacyAccountPublicKey] as string | undefined
  if (!pk) return

  // We don't know smartAccountAddress; keep as gAddress for now (treated as freighter-ish).
  await createAccount({ mode: 'freighter', smartAccountAddress: '', gAddress: pk })
}
