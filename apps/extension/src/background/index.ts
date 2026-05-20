/**
 * Background Service Worker — the ONLY execution context that may hold key material.
 *
 * Responsibilities:
 * - Encrypted vault (keys never leave this context)
 * - Transaction signing
 * - Message routing from popup and content scripts
 *
 * Security rule: NEVER send raw private keys in chrome.runtime.sendMessage responses.
 */

import type {
  BackgroundMessage,
  BackgroundResponse,
  BackendWebauthnAuthenticationFinishRequest,
  BackendWebauthnRegistrationFinishRequest,
  BuildDelegatedTxRequest,
  BuildSendTxRequest,
  BuildTxRequest,
  SetupSendRulesRequest,
  CreateOrConnectFreighterRequest,
  CreateOrConnectPasskeyRequest,
  CreateOrConnectPhantomRequest,
  GetAccountsResponse,
  GetAssetIconDataUrlsRequest,
  GetSmartAccountBalancesRequest,
  GetSmartAccountTransactionsRequest,
  GetDappPermissionsRequest,
  GetSetupStateResponse,
  ImportMnemonicAccountRequest,
  ListPendingDappRequestsResponse,
  PendingDappRequest,
  SerializableError,
  MigrationDiscoverRequest,
  MigrationSweepTokenRequest,
  MigrationSweepXlmRequest,
  GetMarketPricesRequest,
  GetMarketPricesResponse,
  ResolvePendingDappRequest,
  SetActiveAccountRequest,
  SetDappPermissionsRequest,
  SetSetupStateRequest,
  SetupState,
  SignDelegatedGAuthEntryRequest,
  SubmitDelegatedTxRequest,
  SubmitPhantomTxRequest,
  SubmitWebauthnTxRequest,
  UnlockMnemonicVaultRequest,
} from '@latch/types'

import {
  BackendError,
  buildDelegatedTx,
  buildSendTx,
  buildTx,
  setupSendRules,
  createOrConnectFreighter,
  createOrConnectPasskey,
  createOrConnectPhantom,
  ensureFreighterSmartAccountDeployed,
  passkeyAuthenticationBegin,
  passkeyAuthenticationFinish,
  passkeyRegistrationBegin,
  passkeyRegistrationFinish,
  submitTxDelegated,
  submitTxPhantom,
  submitTxWebauthn,
} from './backend'

import { signDelegatedGAddressEntry } from './delegatedLocalSign'
import {
  decryptMnemonicFromVault,
  encryptMnemonicForVault,
  loadMnemonicVaultRecord,
  saveMnemonicVaultRecord,
} from './mnemonicVault'
import { getAssetIconDataUrlsBatch } from './assetIcons'
import {
  clearMnemonicSessionKeys,
  getMnemonicKeypair,
  registerMnemonicKeypair,
} from './mnemonicSession'
import { runMigrationDiscover } from './migration/discover'
import { runMigrationSweepToken, runMigrationSweepXlm } from './migration/sweep'
import { runGetSmartAccountBalances } from './smartAccountBalances'
import { runGetSmartAccountTransactions } from './smartAccountTransactions'
import { deriveStellarKeypairFromMnemonic } from './stellarMnemonic'
import { getMarketPrices } from './marketPrices'

import {
  createAccount,
  getAccounts,
  getDappPermissions,
  listPendingDappRequests,
  addPendingDappRequest,
  removePendingDappRequest,
  clearSession,
  disconnectSessionForLogoutDev,
  migrateLegacyPublicKeyIfNeeded,
  renameAccount,
  setActiveAccount,
  setDappPermissions,
} from './storage'

const STORAGE_KEYS = {
  setupState: 'latch.setupState',
  accountPublicKey: 'latch.accountPublicKey',
  uiSurface: 'latch.uiSurface',
} as const

type UiSurfacePreference = 'popup' | 'sidepanel'

async function getSetupState(): Promise<GetSetupStateResponse> {
  const result = await chrome.storage.local.get([
    STORAGE_KEYS.setupState,
    STORAGE_KEYS.accountPublicKey,
  ])

  return {
    setupState: (result[STORAGE_KEYS.setupState] as SetupState | undefined) ?? 'new',
    accountPublicKey: result[STORAGE_KEYS.accountPublicKey] as string | undefined,
  }
}

async function setSetupState(req: SetSetupStateRequest): Promise<void> {
  await chrome.storage.local.set({
    [STORAGE_KEYS.setupState]: req.setupState,
    [STORAGE_KEYS.accountPublicKey]: req.accountPublicKey,
  })
}

async function applyUiSurfacePreference(pref: UiSurfacePreference) {
  // Side panel API is Chrome-only; Plasmo will map to Firefox sidebar_action where relevant,
  // but we still need to guard the runtime API surface.
  const hasSidePanel = 'sidePanel' in chrome

  try {
    if (pref === 'sidepanel') {
      // Let action-click open the side panel.
      await chrome.action.setPopup({ popup: '' })

      if (hasSidePanel) {
        await chrome.sidePanel.setOptions({ path: 'sidepanel.html', enabled: true })
        await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
      }
    } else {
      await chrome.action.setPopup({ popup: 'popup.html' })
      if (hasSidePanel) {
        await chrome.sidePanel.setOptions({ path: 'sidepanel.html', enabled: true })
        // Critical: do NOT open sidepanel on action click in popup mode.
        await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false })
      }
    }
  } catch (err) {
    console.error('[latch:background] applyUiSurfacePreference failed', err)
  }
}

async function initUiSurfacePreference() {
  const res = await chrome.storage.local.get([STORAGE_KEYS.uiSurface])
  const v = res[STORAGE_KEYS.uiSurface]

  if (v !== 'popup' && v !== 'sidepanel') {
    await chrome.storage.local.set({
      [STORAGE_KEYS.uiSurface]: 'popup' satisfies UiSurfacePreference,
    })
    await applyUiSurfacePreference('popup')
    return
  }

  await applyUiSurfacePreference(v)
}

chrome.runtime.onInstalled.addListener((details) => {
  // Always default to popup on first install, and reset to popup on update so users
  // don't get stuck in sidepanel mode without realizing why action-click changed.
  if (details.reason === 'install' || details.reason === 'update') {
    void chrome.storage.local
      .set({ [STORAGE_KEYS.uiSurface]: 'popup' satisfies UiSurfacePreference })
      .then(() => applyUiSurfacePreference('popup'))
    return
  }

  void initUiSurfacePreference()
})

chrome.runtime.onStartup.addListener(() => {
  void initUiSurfacePreference()
  void migrateLegacyPublicKeyIfNeeded()
})

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== 'local') return
  const change = changes[STORAGE_KEYS.uiSurface]
  if (!change) return
  const next = change.newValue
  const pref: UiSurfacePreference = next === 'sidepanel' ? 'sidepanel' : 'popup'
  void applyUiSurfacePreference(pref)
})

function ok<T>(data?: T): BackgroundResponse<T> {
  return { ok: true, data }
}

function toSerializableError(err: unknown): SerializableError {
  if (err instanceof BackendError) return err.toSerializable()
  if (err instanceof Error) return { message: err.message }
  return { message: String(err) }
}

type PendingResolver = (result: { approved: boolean; signedXdr?: string }) => void
const pendingDappResolvers = new Map<string, PendingResolver>()

function mergePermissions<T extends string>(base: T[], add: T): T[] {
  return base.includes(add) ? base : [...base, add]
}

async function openApprovalPopup() {
  try {
    // Prefer openPopup when available
    if ('action' in chrome && typeof chrome.action.openPopup === 'function') {
      await chrome.action.openPopup()
      return
    }
  } catch {
    // fall through to window.create
  }

  try {
    await chrome.windows.create({
      url: chrome.runtime.getURL('popup.html'),
      type: 'popup',
      width: 400,
      height: 650,
    })
  } catch (err) {
    console.error('[latch:background] openApprovalPopup failed', err)
  }
}

async function requireDappApproval(args: {
  origin: string
  kind: PendingDappRequest['kind']
}): Promise<{
  approved: boolean
  signedXdr?: string
}> {
  const requestId = crypto.randomUUID()
  const pending: PendingDappRequest = {
    id: requestId,
    origin: args.origin,
    kind: args.kind,
    createdAt: Date.now(),
  }
  await addPendingDappRequest(pending)
  await openApprovalPopup()

  return await new Promise((resolve) => {
    pendingDappResolvers.set(requestId, resolve)
  })
}

chrome.runtime.onMessage.addListener((rawMessage: BackgroundMessage, _sender, sendResponse) => {
  const message = rawMessage as BackgroundMessage

  ;(async () => {
    switch (message?.type) {
      case 'GET_SETUP_STATE': {
        const data = await getSetupState()
        sendResponse(ok<GetSetupStateResponse>(data))
        return
      }

      case 'SET_SETUP_STATE': {
        await setSetupState(message.payload as SetSetupStateRequest)
        sendResponse(ok())
        return
      }

      case 'LOGOUT': {
        clearMnemonicSessionKeys()
        await disconnectSessionForLogoutDev()
        await setSetupState({ setupState: 'new', accountPublicKey: undefined })
        sendResponse(ok())
        return
      }

      case 'GET_ACCOUNTS': {
        const data = await getAccounts()
        let activeAccountHasMnemonicVault: boolean | undefined
        let activeAccountMnemonicSignerLoaded: boolean | undefined
        if (data.activeAccountId) {
          const active = data.accounts.find((a) => a.id === data.activeAccountId)
          if (active?.mode === 'mnemonic') {
            const rec = await loadMnemonicVaultRecord(active.id)
            activeAccountHasMnemonicVault = Boolean(rec)
            activeAccountMnemonicSignerLoaded = Boolean(getMnemonicKeypair(active.id))
          }
        }
        const payload: GetAccountsResponse = {
          ...data,
          activeAccountHasMnemonicVault,
          activeAccountMnemonicSignerLoaded,
        }
        sendResponse(ok<GetAccountsResponse>(payload))
        return
      }

      case 'SET_ACTIVE_ACCOUNT': {
        const req = message.payload as SetActiveAccountRequest
        await setActiveAccount(req.accountId)
        sendResponse(ok())
        return
      }

      case 'CREATE_OR_CONNECT_FREIGHTER': {
        const req = message.payload as CreateOrConnectFreighterRequest
        const data = await createOrConnectFreighter(req)
        const { account } = await createAccount({
          mode: 'freighter',
          smartAccountAddress: data.smartAccountAddress,
          gAddress: req.gAddress,
        })
        sendResponse(ok({ ...data, account }))
        return
      }

      case 'CREATE_OR_CONNECT_PHANTOM': {
        const req = message.payload as CreateOrConnectPhantomRequest
        const data = await createOrConnectPhantom(req)
        const { account } = await createAccount({
          mode: 'phantom',
          smartAccountAddress: data.smartAccountAddress,
          gAddress: data.gAddress,
          phantomPublicKeyHex: req.publicKeyHex,
        })
        sendResponse(ok({ ...data, account }))
        return
      }

      case 'CREATE_OR_CONNECT_PASSKEY': {
        const req = message.payload as CreateOrConnectPasskeyRequest
        const data = await createOrConnectPasskey(req)
        const { account } = await createAccount({
          mode: 'passkey',
          smartAccountAddress: data.smartAccountAddress,
          passkeyCredentialId: req.credentialId,
          passkeyKeyDataHex: req.keyDataHex,
        })
        sendResponse(ok({ ...data, account }))
        return
      }

      case 'PASSKEY_REG_BEGIN': {
        const req = (message.payload as { displayName?: string } | undefined) ?? undefined
        const data = await passkeyRegistrationBegin(req)
        sendResponse(ok(data))
        return
      }

      case 'PASSKEY_REG_FINISH': {
        const req = message.payload as BackendWebauthnRegistrationFinishRequest
        const data = await passkeyRegistrationFinish(req)
        const { account } = await createAccount({
          mode: 'passkey',
          smartAccountAddress: data.smartAccountAddress,
          passkeyCredentialId: data.credentialId,
          passkeyKeyDataHex: data.keyDataHex,
        })
        sendResponse(ok({ ...data, account }))
        return
      }

      case 'PASSKEY_AUTH_BEGIN': {
        const data = await passkeyAuthenticationBegin()
        sendResponse(ok(data))
        return
      }

      case 'PASSKEY_AUTH_FINISH': {
        const req = message.payload as BackendWebauthnAuthenticationFinishRequest
        const data = await passkeyAuthenticationFinish(req)

        const activeCredentialId = data.activeCredentialId ?? data.accounts?.[0]?.credentialId
        if (!activeCredentialId) {
          throw new BackendError('Passkey login did not return a credential id.', {
            code: 'invalid_response',
          })
        }

        const { account, activeAccountId } = await createAccount({
          mode: 'passkey',
          smartAccountAddress: data.smartAccountAddress,
          passkeyCredentialId: activeCredentialId,
          passkeyKeyDataHex: data.keyDataHex,
        })

        // Best-effort: attach other passkey accounts from session list (may not include keyDataHex).
        for (const a of data.accounts ?? []) {
          if (!a.smartAccountAddress || !a.credentialId) continue
          await createAccount({
            mode: 'passkey',
            smartAccountAddress: a.smartAccountAddress,
            passkeyCredentialId: a.credentialId,
          })
        }

        const accRes = await getAccounts()
        sendResponse(ok({ ...data, account, accounts: accRes.accounts, activeAccountId }))
        return
      }

      case 'RENAME_ACCOUNT': {
        const req = message.payload as { accountId: string; label?: string }
        await renameAccount(req)
        sendResponse(ok())
        return
      }

      case 'IMPORT_MNEMONIC_ACCOUNT': {
        const req = message.payload as ImportMnemonicAccountRequest
        if (req.remember && (!req.encryptionPassword || req.encryptionPassword.length < 8)) {
          throw new BackendError(
            'Choose an encryption password of at least 8 characters to remember your seed.',
            {
              code: 'invalid_input',
            }
          )
        }
        const { keypair, gAddress } = deriveStellarKeypairFromMnemonic(
          req.mnemonic,
          req.bip39Passphrase
        )
        const data = await ensureFreighterSmartAccountDeployed(gAddress)
        const { account } = await createAccount({
          mode: 'mnemonic',
          smartAccountAddress: data.smartAccountAddress,
          gAddress,
        })
        registerMnemonicKeypair(account.id, keypair)
        if (req.remember && req.encryptionPassword) {
          const record = await encryptMnemonicForVault({
            accountId: account.id,
            mnemonic: req.mnemonic,
            bip39Passphrase: req.bip39Passphrase ?? '',
            encryptionPassword: req.encryptionPassword,
          })
          await saveMnemonicVaultRecord(record)
        }
        sendResponse(
          ok({
            gAddress,
            smartAccountAddress: data.smartAccountAddress,
            alreadyDeployed: data.alreadyDeployed,
            account,
          })
        )
        return
      }

      case 'UNLOCK_MNEMONIC_VAULT': {
        const req = message.payload as UnlockMnemonicVaultRequest
        const record = await loadMnemonicVaultRecord(req.accountId)
        if (!record) {
          throw new BackendError('No encrypted seed is stored for this account.', {
            code: 'no_vault',
          })
        }
        const { mnemonic, bip39Passphrase } = await decryptMnemonicFromVault(
          record,
          req.encryptionPassword
        )
        const { keypair, gAddress } = deriveStellarKeypairFromMnemonic(
          mnemonic,
          bip39Passphrase ? bip39Passphrase : undefined
        )
        const { accounts } = await getAccounts()
        const acc = accounts.find((a) => a.id === req.accountId)
        if (!acc || acc.mode !== 'mnemonic' || acc.gAddress !== gAddress) {
          throw new BackendError('Account does not match saved seed.', { code: 'account_mismatch' })
        }
        registerMnemonicKeypair(acc.id, keypair)
        sendResponse(ok())
        return
      }

      case 'SIGN_DELEGATED_G_AUTH_ENTRY': {
        const req = message.payload as SignDelegatedGAuthEntryRequest
        const kp = getMnemonicKeypair(req.accountId)
        if (!kp) {
          throw new BackendError(
            'Seed signer is not loaded. Re-open the wallet and unlock with your encryption password if you enabled Remember.',
            { code: 'mnemonic_locked' }
          )
        }
        const signed = await signDelegatedGAddressEntry({
          gAddressEntryTemplateXdr: req.gAddressEntryTemplateXdr,
          signer: kp,
          networkPassphrase: req.networkPassphrase,
        })
        sendResponse(ok(signed))
        return
      }

      case 'BUILD_TX': {
        const req = message.payload as BuildTxRequest
        const data = await buildTx(req)
        sendResponse(ok(data))
        return
      }

      case 'BUILD_DELEGATED_TX': {
        const req = message.payload as BuildDelegatedTxRequest
        const data = await buildDelegatedTx(req)
        sendResponse(ok(data))
        return
      }

      case 'SUBMIT_TX_PHANTOM': {
        const req = message.payload as SubmitPhantomTxRequest
        const data = await submitTxPhantom(req)
        sendResponse(ok(data))
        return
      }

      case 'SUBMIT_TX_DELEGATED': {
        const req = message.payload as SubmitDelegatedTxRequest
        const data = await submitTxDelegated(req)
        sendResponse(ok(data))
        return
      }

      case 'SUBMIT_TX_WEBAUTHN': {
        const req = message.payload as SubmitWebauthnTxRequest
        const data = await submitTxWebauthn(req)
        sendResponse(ok(data))
        return
      }

      case 'MIGRATION_DISCOVER': {
        const req = message.payload as MigrationDiscoverRequest
        const data = await runMigrationDiscover(req.accountId)
        sendResponse(ok(data))
        return
      }

      case 'MIGRATION_SWEEP_XLM': {
        const req = message.payload as MigrationSweepXlmRequest
        const data = await runMigrationSweepXlm(req.accountId, req.pendingTokenSweepCount ?? 0)
        sendResponse(ok(data))
        return
      }

      case 'MIGRATION_SWEEP_TOKEN': {
        const req = message.payload as MigrationSweepTokenRequest
        const data = await runMigrationSweepToken(req.accountId, req.sacContractId)
        sendResponse(ok(data))
        return
      }

      case 'GET_SMART_ACCOUNT_BALANCES': {
        const req = message.payload as GetSmartAccountBalancesRequest
        const data = await runGetSmartAccountBalances(req.accountId)
        sendResponse(ok(data))
        return
      }

      case 'GET_SMART_ACCOUNT_TRANSACTIONS': {
        const req = message.payload as GetSmartAccountTransactionsRequest
        const data = await runGetSmartAccountTransactions(req.accountId)
        sendResponse(ok(data))
        return
      }

      case 'GET_MARKET_PRICES': {
        const req = message.payload as GetMarketPricesRequest
        const data = await getMarketPrices(req.tokens ?? [])
        const payload: GetMarketPricesResponse = {
          updatedAtMs: data.updatedAtMs,
          pricesByCodeUpper: Object.fromEntries(
            Object.entries(data.pricesByCodeUpper).map(([k, v]) => [k, v] as const)
          ),
        }
        sendResponse(ok(payload))
        return
      }

      case 'GET_ASSET_ICON_DATA_URLS': {
        const req = message.payload as GetAssetIconDataUrlsRequest
        const data = await getAssetIconDataUrlsBatch(req)
        sendResponse(ok(data))
        return
      }

      case 'BUILD_SEND_TX': {
        const req = message.payload as BuildSendTxRequest
        const data = await buildSendTx(req)
        sendResponse(ok(data))
        return
      }

      case 'SETUP_SEND_RULES': {
        const req = message.payload as SetupSendRulesRequest
        const data = await setupSendRules(req)
        sendResponse(ok(data))
        return
      }

      case 'GET_DAPP_PERMISSIONS': {
        const req = message.payload as GetDappPermissionsRequest
        const allowed = await getDappPermissions(req.origin)
        sendResponse(ok({ origin: req.origin, allowed }))
        return
      }

      case 'SET_DAPP_PERMISSIONS': {
        const req = message.payload as SetDappPermissionsRequest
        const allowed = await setDappPermissions(req.origin, req.allowed)
        sendResponse(ok({ origin: req.origin, allowed }))
        return
      }

      case 'LIST_PENDING_DAPP_REQUESTS': {
        const requests = await listPendingDappRequests()
        const data: ListPendingDappRequestsResponse = { requests }
        sendResponse(ok(data))
        return
      }

      case 'RESOLVE_PENDING_DAPP_REQUEST': {
        const req = message.payload as ResolvePendingDappRequest
        const resolver = pendingDappResolvers.get(req.requestId)
        pendingDappResolvers.delete(req.requestId)
        await removePendingDappRequest(req.requestId)
        resolver?.({ approved: req.approved, signedXdr: req.signedXdr })
        sendResponse(ok())
        return
      }

      case 'DAPP_GET_PUBLIC_KEY': {
        const req = message.payload as GetDappPermissionsRequest
        const allowed = await getDappPermissions(req.origin)
        if (!allowed.includes('getPublicKey')) {
          const approval = await requireDappApproval({ origin: req.origin, kind: 'getPublicKey' })
          if (!approval.approved)
            throw new BackendError('User rejected', { status: 403, code: 'user_rejected' })
          await setDappPermissions(req.origin, mergePermissions(allowed, 'getPublicKey'))
        }
        const { accounts, activeAccountId } = await getAccounts()
        const active = accounts.find((a) => a.id === activeAccountId) ?? accounts[0]
        if (!active?.smartAccountAddress) {
          throw new BackendError('No active account', { status: 400, code: 'no_account' })
        }
        sendResponse(ok({ publicKey: active.smartAccountAddress }))
        return
      }

      case 'DAPP_SIGN_TRANSACTION': {
        const req = message.payload as any
        const origin =
          (req?.origin as string | undefined) ?? (req?.request?.origin as string | undefined)
        const normalizedOrigin = origin ?? 'unknown'
        const allowed = await getDappPermissions(normalizedOrigin)
        if (!allowed.includes('signTransaction')) {
          const approval = await requireDappApproval({
            origin: normalizedOrigin,
            kind: 'signTransaction',
          })
          if (!approval.approved)
            throw new BackendError('User rejected', { status: 403, code: 'user_rejected' })
          if (!approval.signedXdr)
            throw new BackendError('Signing not completed', { status: 400, code: 'no_signature' })
          await setDappPermissions(normalizedOrigin, mergePermissions(allowed, 'signTransaction'))
          sendResponse(ok({ response: { signedXdr: approval.signedXdr } }))
          return
        }
        throw new BackendError('signTransaction requires user gesture via popup', {
          status: 400,
          code: 'not_supported',
        })
      }

      default: {
        console.log('[latch:background] message received', message)
        sendResponse(ok())
        return
      }
    }
  })().catch((err) => {
    sendResponse({ ok: false, error: toSerializableError(err) } satisfies BackgroundResponse)
  })

  return true // keep channel open for async responses
})

export {}
