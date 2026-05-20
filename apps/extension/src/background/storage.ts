import type {
  AccountMode,
  DappPermission,
  GetAccountsResponse,
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
  })
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
