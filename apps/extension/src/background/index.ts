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

import './cleanup-main-injector'

import type {
  BackgroundMessage,
  BackgroundResponse,
  BackendWebauthnAuthenticationFinishRequest,
  BackendWebauthnRegistrationFinishRequest,
  BuildDelegatedTxRequest,
  BuildSendTxRequest,
  BuildTxRequest,
  SetupSendRulesRequest,
  SetupSwapRulesRequest,
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
  GetSwapQuoteRequest,
  GetSwapTokenCatalogRequest,
  PrepareSwapTxRequest,
  RecordKnownSacProbeRequest,
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
  RunExternalSignFlowRequest,
  ExternalSignResult,
  SignTransactionResponse,
  DappOpenSignRequestPayload,
} from '@latch/types'

import {
  BackendError,
  buildDelegatedTx,
  buildSendTx,
  buildTx,
  setupSendRules,
  setupSwapRules,
  createOrConnectFreighter,
  createOrConnectPasskey,
  createOrConnectPhantom,
  ensureFreighterSmartAccountDeployed,
  getBackendAccounts,
  passkeyAuthenticationBegin,
  passkeyAuthenticationFinish,
  passkeyRegistrationBegin,
  passkeyRegistrationFinish,
  submitTxDelegated,
  submitTxPhantom,
  submitTxWebauthn,
} from './backend'

import { getActiveNetwork, getNetworkConfig, networkLabelFor, setActiveNetwork } from './network/config'
import { clearNetworkScopedMemoryCaches } from './network/clearCaches'
import { broadcastActiveAccountChanged, broadcastNetworkChanged } from './dappProviderEvents'
import { buildSignRequestSearchParams } from './externalSign/parseSignRequest'
import {
  runExternalSignFlow,
  type ExternalSignDecision,
} from './externalSign/orchestrator'

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
import { recordKnownSacProbe } from './knownSacProbes'
import {
  runGetSwapQuote,
  runGetSwapTokenCatalog,
  runPrepareSwapTx,
} from './swap/handlers'
import { runGetSmartAccountTransactions } from './smartAccountTransactions'
import { deriveStellarKeypairFromMnemonic } from './stellarMnemonic'
import { getMarketPrices } from './marketPrices'
import { tryHandleMultisigMessage } from './multisig/handlers'
import { tryHandleDepositMessage } from './deposit/handlers'
import { tryHandleV1AuthMessage } from './v1Auth/handlers'
import { debugAgentLog, postDebugPayload } from './debugAgentLog'

import {
  createAccount,
  getAccounts,
  getDappPermissions,
  listPendingDappRequests,
  addPendingDappRequest,
  removePendingDappRequest,
  clearPendingDappRequests,
  disconnectSessionForLogoutDev,
  migrateLegacyPublicKeyIfNeeded,
  renameAccount,
  setActiveAccount,
  setDappPermissions,
  getSetupStateForNetwork,
  setSetupStateForNetwork,
  storageKeys,
} from './storage'

const STORAGE_KEYS = {
  setupState: 'latch.setupState',
  accountPublicKey: 'latch.accountPublicKey',
  uiSurface: 'latch.uiSurface',
} as const

type UiSurfacePreference = 'popup' | 'sidepanel'

async function getSetupState(): Promise<GetSetupStateResponse> {
  const network = await getActiveNetwork()
  const setupState =
    ((await getSetupStateForNetwork(network)) as SetupState | undefined) ?? 'new'
  const result = await chrome.storage.local.get([STORAGE_KEYS.accountPublicKey])

  return {
    setupState,
    accountPublicKey: result[STORAGE_KEYS.accountPublicKey] as string | undefined,
  }
}

async function setSetupState(req: SetSetupStateRequest): Promise<void> {
  const network = await getActiveNetwork()
  await setSetupStateForNetwork(network, req.setupState, req.accountPublicKey)
}

const ONBOARDING_TAB_PATH = 'tabs/onboarding.html'
const ACCOUNTS_BY_NETWORK_KEY = storageKeys().accountsByNetwork
const ACTIVE_ID_BY_NETWORK_KEY = storageKeys().activeAccountIdByNetwork
const SETUP_BY_NETWORK_KEY = storageKeys().setupStateByNetwork
const LEGACY_ACCOUNTS_KEY = storageKeys().accounts
const LEGACY_ACTIVE_ID_KEY = storageKeys().activeAccountId
const LEGACY_SETUP_KEY = storageKeys().setupState
const NETWORK_STORAGE_KEY = 'latch.network'

/**
 * Stored accounts are the source of truth for whether onboarding should show.
 * `latch.setupState` can be missing on older installs or after partial logout flows.
 */
async function ensureSetupStateMatchesAccounts(): Promise<void> {
  const { accounts, activeAccountId } = await getAccounts()
  if (accounts.length === 0) return

  const { setupState } = await getSetupState()
  if (setupState === 'has_account') return

  const active = accounts.find((a) => a.id === activeAccountId) ?? accounts[0]
  const accountPublicKey =
    active?.smartAccountAddress?.trim() || active?.gAddress?.trim() || undefined

  await setSetupState({ setupState: 'has_account', accountPublicKey })
}

async function needsOnboardingFlow(): Promise<boolean> {
  const { accounts } = await getAccounts()
  return accounts.length === 0
}

async function openOnboardingTab(): Promise<void> {
  const url = chrome.runtime.getURL(ONBOARDING_TAB_PATH)

  try {
    const existing = await chrome.tabs.query({ url: `${url}*` })
    const tab = existing.find((t) => t.url?.startsWith(url))
    if (tab?.id !== undefined) {
      await chrome.tabs.update(tab.id, { active: true })
      if (tab.windowId !== undefined) {
        await chrome.windows.update(tab.windowId, { focused: true })
      }
      return
    }
  } catch (err) {
    console.warn('[latch:background] openOnboardingTab query failed; creating tab', err)
  }

  await chrome.tabs.create({ url })
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

function handleOnboardingActionClick(): void {
  void (async () => {
    if (await needsOnboardingFlow()) {
      await openOnboardingTab()
    }
  })()
}

let onboardingActionClickListening = false

/**
 * Chrome toggles the side panel from the toolbar when `openPanelOnActionClick` is true.
 * A registered `action.onClicked` listener prevents that native toggle, so only attach
 * it while onboarding (no accounts) still needs the full-screen tab flow.
 */
function syncOnboardingActionClickListener(needsOnboarding: boolean): void {
  if (needsOnboarding && !onboardingActionClickListening) {
    chrome.action.onClicked.addListener(handleOnboardingActionClick)
    onboardingActionClickListening = true
    return
  }
  if (!needsOnboarding && onboardingActionClickListening) {
    chrome.action.onClicked.removeListener(handleOnboardingActionClick)
    onboardingActionClickListening = false
  }
}

/** Popup / side panel when set up; full-screen onboarding tab before `has_account`. */
async function applyActionClickBehavior(): Promise<void> {
  try {
    const needsOnboarding = await needsOnboardingFlow()
    syncOnboardingActionClickListener(needsOnboarding)

    if (needsOnboarding) {
      await chrome.action.setPopup({ popup: '' })
      if ('sidePanel' in chrome) {
        await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false })
      }
      return
    }

    const res = await chrome.storage.local.get([STORAGE_KEYS.uiSurface])
    const pref: UiSurfacePreference =
      res[STORAGE_KEYS.uiSurface] === 'sidepanel' ? 'sidepanel' : 'popup'
    await applyUiSurfacePreference(pref)
  } catch (err) {
    console.error('[latch:background] applyActionClickBehavior failed', err)
  }
}

async function initExtensionActionBehavior() {
  const res = await chrome.storage.local.get([STORAGE_KEYS.uiSurface])
  const v = res[STORAGE_KEYS.uiSurface]

  if (v !== 'popup' && v !== 'sidepanel') {
    await chrome.storage.local.set({
      [STORAGE_KEYS.uiSurface]: 'popup' satisfies UiSurfacePreference,
    })
  }

  await ensureSetupStateMatchesAccounts()
  await applyActionClickBehavior()
}

chrome.runtime.onInstalled.addListener((details) => {
  // Always default to popup on first install, and reset to popup on update so users
  // don't get stuck in sidepanel mode without realizing why action-click changed.
  if (details.reason === 'install' || details.reason === 'update') {
    void chrome.storage.local
      .set({ [STORAGE_KEYS.uiSurface]: 'popup' satisfies UiSurfacePreference })
      .then(async () => {
        await ensureSetupStateMatchesAccounts()
        await applyActionClickBehavior()
      })
    return
  }

  void initExtensionActionBehavior()
})

chrome.runtime.onStartup.addListener(() => {
  void initExtensionActionBehavior()
  void migrateLegacyPublicKeyIfNeeded()
})

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== 'local') return
  if (
    changes[STORAGE_KEYS.uiSurface] ||
    changes[LEGACY_SETUP_KEY] ||
    changes[SETUP_BY_NETWORK_KEY] ||
    changes[LEGACY_ACCOUNTS_KEY] ||
    changes[ACCOUNTS_BY_NETWORK_KEY] ||
    changes[NETWORK_STORAGE_KEY]
  ) {
    void ensureSetupStateMatchesAccounts().then(() => applyActionClickBehavior())
  }
  if (
    changes[LEGACY_ACTIVE_ID_KEY] ||
    changes[ACTIVE_ID_BY_NETWORK_KEY] ||
    changes[LEGACY_ACCOUNTS_KEY] ||
    changes[ACCOUNTS_BY_NETWORK_KEY]
  ) {
    void broadcastActiveAccountChanged()
  }
  if (changes[NETWORK_STORAGE_KEY]) {
    void broadcastNetworkChanged()
  }
})

function ok<T>(data?: T): BackgroundResponse<T> {
  return { ok: true, data }
}

function toSerializableError(err: unknown): SerializableError {
  if (err instanceof BackendError) return err.toSerializable()
  if (err instanceof Error) return { message: err.message }
  return { message: String(err) }
}

type PendingResolver = (result: ExternalSignDecision) => void
const pendingDappResolvers = new Map<string, PendingResolver>()
const approvalPopupWindowIds = new Set<number>()

function mergePermissions<T extends string>(base: T[], add: T): T[] {
  return base.includes(add) ? base : [...base, add]
}

function waitForExternalSignDecision(requestId: string): Promise<ExternalSignDecision> {
  return new Promise((resolve) => {
    pendingDappResolvers.set(requestId, resolve)
  })
}

function rejectAllPendingDappRequests(decision: ExternalSignDecision = { approved: false }) {
  for (const [requestId, resolver] of pendingDappResolvers.entries()) {
    resolver(decision)
    pendingDappResolvers.delete(requestId)
  }
  void clearPendingDappRequests()
}

function rejectPendingOnWindowClose(windowId: number) {
  if (!approvalPopupWindowIds.has(windowId)) return
  approvalPopupWindowIds.delete(windowId)
  rejectAllPendingDappRequests({ approved: false })
}

if (chrome.windows?.onRemoved) {
  chrome.windows.onRemoved.addListener((windowId) => {
    rejectPendingOnWindowClose(windowId)
  })
}

async function openApprovalPopup(): Promise<number | undefined> {
  try {
    if ('action' in chrome && typeof chrome.action.openPopup === 'function') {
      await chrome.action.openPopup()
      return undefined
    }
  } catch {
    // fall through to window.create
  }

  try {
    const win = await chrome.windows.create({
      url: chrome.runtime.getURL('popup.html'),
      type: 'popup',
      width: 400,
      height: 650,
    })
    if (win.id !== undefined) {
      approvalPopupWindowIds.add(win.id)
      return win.id
    }
  } catch (err) {
    console.error('[latch:background] openApprovalPopup failed', err)
  }
  return undefined
}

async function requireDappApproval(args: {
  origin: string
  kind: PendingDappRequest['kind']
  signRequest?: PendingDappRequest['signRequest']
  prepared?: PendingDappRequest['prepared']
  source?: PendingDappRequest['source']
}): Promise<ExternalSignDecision> {
  const requestId = crypto.randomUUID()
  const pending: PendingDappRequest = {
    id: requestId,
    origin: args.origin,
    kind: args.kind,
    createdAt: Date.now(),
    signRequest: args.signRequest,
    prepared: args.prepared,
    source: args.source,
  }
  // Register waiter before durable enqueue so LIST cannot treat this as an orphan.
  const decisionPromise = waitForExternalSignDecision(requestId)
  await addPendingDappRequest(pending)
  await openApprovalPopup()
  return await decisionPromise
}

function mapExternalSignResultToProviderResponse(
  result: ExternalSignResult
): SignTransactionResponse {
  if (result.status === 'rejected') {
    throw new BackendError(result.message ?? 'User rejected', {
      status: 403,
      code: result.code ?? 'user_rejected',
    })
  }
  if (result.status === 'error') {
    throw new BackendError(result.message ?? 'Signing failed', {
      status: 400,
      code: result.code ?? 'error',
    })
  }
  return {
    txHash: result.txHash,
    signedAuthEntry: result.signedAuthEntry,
    signedTxXdr: result.signedTxXdr,
    signedXdr: result.signedTxXdr ?? result.txHash,
  }
}

chrome.runtime.onMessage.addListener((rawMessage: BackgroundMessage, _sender, sendResponse) => {
  // #region agent log
  const maybeDebug = rawMessage as { type?: string; payload?: Record<string, unknown> }
  if (maybeDebug?.type === 'DEBUG_AGENT_LOG' && maybeDebug.payload) {
    postDebugPayload(maybeDebug.payload as Parameters<typeof postDebugPayload>[0])
    sendResponse({ ok: true })
    return true
  }
  // #endregion
  const message = rawMessage as BackgroundMessage

  ;(async () => {
    if (await tryHandleMultisigMessage(message, sendResponse, ok)) {
      return
    }
    if (await tryHandleV1AuthMessage(message, sendResponse, ok)) {
      return
    }
    if (await tryHandleDepositMessage(message, sendResponse, ok)) {
      return
    }

    switch (message?.type) {
      case 'GET_SETUP_STATE': {
        await ensureSetupStateMatchesAccounts()
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
        await ensureSetupStateMatchesAccounts()
        sendResponse(ok())
        return
      }

      case 'GET_ACCOUNTS': {
        await ensureSetupStateMatchesAccounts()
        let repairedCount = 0
        try {
          const { repairDisplacedPasskeySmartAccountAddresses } = await import(
            './api/repairPasskeyAddress'
          )
          const repaired = await repairDisplacedPasskeySmartAccountAddresses()
          repairedCount = repaired.repairedCount
          if (repairedCount > 0) {
            const { clearSmartAccountBalancesMemoryCache } = await import('./smartAccountBalances')
            clearSmartAccountBalancesMemoryCache()
          }
        } catch {
          // best-effort repair only
        }
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
        // storage.onChanged also broadcasts; await here so dApps update before UI continues
        await broadcastActiveAccountChanged()
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
        const before = await getAccounts()
        const existing = before.accounts.find(
          (a) =>
            a.mode === 'passkey' &&
            ((req.credentialId && a.passkeyCredentialId === req.credentialId) ||
              (req.smartAccountAddress && a.smartAccountAddress === req.smartAccountAddress))
        )
        const data = await createOrConnectPasskey({
          keyDataHex: req.keyDataHex,
          credentialId: req.credentialId,
        })
        const existingAddr = existing?.smartAccountAddress?.trim()
        const hinted = req.smartAccountAddress?.trim()
        const apiAddr = data.smartAccountAddress?.trim() ?? ''
        const keepAddr = existingAddr || hinted
        if (keepAddr && apiAddr && keepAddr !== apiAddr) {
          const { recordPasskeyAddressDisplacement } = await import('./api/repairPasskeyAddress')
          await recordPasskeyAddressDisplacement({
            credentialId: req.credentialId,
            previousAddress: keepAddr,
            factoryAddress: apiAddr,
          })
        }
        // Never persist a different factory prediction over the funded local C-address.
        const smartAccountAddress = keepAddr || apiAddr
        const { account } = await createAccount({
          mode: 'passkey',
          smartAccountAddress,
          passkeyCredentialId: req.credentialId,
          passkeyKeyDataHex: req.keyDataHex,
        })
        sendResponse(
          ok({
            ...data,
            smartAccountAddress,
            alreadyDeployed: data.alreadyDeployed || Boolean(keepAddr && keepAddr === apiAddr),
            account,
          })
        )
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
        let keyDataHex = typeof data.keyDataHex === 'string' ? data.keyDataHex.trim() : ''
        let credentialId = data.credentialId
        // Backend should return keyDataHex; fall back to client extraction so send/sign can proceed.
        if (!keyDataHex && req.response) {
          try {
            const { extractRegistrationKeyData } = await import('../ui/webauthn/passkey')
            const extracted = extractRegistrationKeyData(req.response)
            keyDataHex = extracted.keyDataHex
            if (!credentialId) credentialId = extracted.credentialId
          } catch {
            // keep empty; createAccount will surface missing data on send/setup
          }
        }
        const { account } = await createAccount({
          mode: 'passkey',
          smartAccountAddress: data.smartAccountAddress,
          passkeyCredentialId: credentialId,
          passkeyKeyDataHex: keyDataHex || undefined,
        })
        sendResponse(ok({ ...data, credentialId, keyDataHex, account }))
        return
      }

      case 'GET_BACKEND_ACCOUNTS': {
        const data = await getBackendAccounts()
        sendResponse(ok(data))
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
        const data = await runGetSmartAccountTransactions(req.accountId, {
          force: req.force === true,
        })
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
        const network = req.network ?? (await getActiveNetwork())
        const data = await buildSendTx({ ...req, network })
        sendResponse(ok(data))
        return
      }

      case 'SETUP_SEND_RULES': {
        const req = message.payload as SetupSendRulesRequest
        const network = req.network ?? (await getActiveNetwork())
        const data = await setupSendRules({ ...req, network })
        sendResponse(ok(data))
        return
      }

      case 'GET_SWAP_TOKEN_CATALOG': {
        const req = message.payload as GetSwapTokenCatalogRequest
        const data = await runGetSwapTokenCatalog(req)
        sendResponse(ok(data))
        return
      }

      case 'GET_SWAP_QUOTE': {
        const req = message.payload as GetSwapQuoteRequest
        const data = await runGetSwapQuote(req)
        sendResponse(ok(data))
        return
      }

      case 'PREPARE_SWAP_TX': {
        const req = message.payload as PrepareSwapTxRequest
        const data = await runPrepareSwapTx(req)
        sendResponse(ok(data))
        return
      }

      case 'SETUP_SWAP_RULES': {
        const req = message.payload as SetupSwapRulesRequest
        const network = req.network ?? (await getActiveNetwork())
        const data = await setupSwapRules({ ...req, network })
        sendResponse(ok(data))
        return
      }

      case 'RECORD_KNOWN_SAC_PROBE': {
        const req = message.payload as RecordKnownSacProbeRequest
        await recordKnownSacProbe(req.accountId, req.probe)
        sendResponse(ok(undefined))
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
        const stored = await listPendingDappRequests()
        // Drop orphans left after SW restart (in-memory waiters are gone).
        const requests = stored.filter((r) => pendingDappResolvers.has(r.id))
        if (requests.length !== stored.length) {
          const liveIds = new Set(requests.map((r) => r.id))
          for (const orphan of stored) {
            if (!liveIds.has(orphan.id)) await removePendingDappRequest(orphan.id)
          }
        }
        const data: ListPendingDappRequestsResponse = { requests }
        sendResponse(ok(data))
        return
      }

      case 'RESOLVE_PENDING_DAPP_REQUEST': {
        const req = message.payload as ResolvePendingDappRequest
        const resolver = pendingDappResolvers.get(req.requestId)
        pendingDappResolvers.delete(req.requestId)
        await removePendingDappRequest(req.requestId)
        resolver?.({
          approved: req.approved,
          errorMessage: req.errorMessage,
          errorCode: req.errorCode,
          signedXdr: req.signedXdr,
          txHash: req.txHash,
          signedAuthEntry: req.signedAuthEntry,
          signedTxXdr: req.signedTxXdr,
        })
        sendResponse(ok())
        return
      }

      case 'PING_EXTENSION': {
        sendResponse(ok({ connected: true as const }))
        return
      }

      case 'GET_ACTIVE_NETWORK': {
        const cfg = await getNetworkConfig()
        sendResponse(ok({ network: cfg.network, networkLabel: cfg.networkLabel }))
        return
      }

      case 'SET_ACTIVE_NETWORK': {
        const req = message.payload as { network: 'testnet' | 'mainnet' }
        const network = await setActiveNetwork(req.network)
        clearNetworkScopedMemoryCaches()
        await broadcastNetworkChanged(network)
        await broadcastActiveAccountChanged()
        sendResponse(ok({ network, networkLabel: networkLabelFor(network) }))
        return
      }

      case 'PREPARE_EXTERNAL_SIGN': {
        const req = message.payload as RunExternalSignFlowRequest
        const result = await runExternalSignFlow({
          source: 'sign-request-tab',
          request: req.request,
          senderUrl: undefined,
          waitForDecision: waitForExternalSignDecision,
          enqueueReview: async (pending) => {
            await addPendingDappRequest(pending)
          },
        })
        sendResponse(ok(result))
        return
      }

      case 'RUN_EXTERNAL_SIGN_FLOW': {
        const req = message.payload as RunExternalSignFlowRequest
        if (req.source === 'sign-request-tab') {
          const result = await runExternalSignFlow({
            source: 'sign-request-tab',
            request: req.request,
            waitForDecision: waitForExternalSignDecision,
            enqueueReview: async (pending) => {
              await addPendingDappRequest(pending)
            },
          })
          sendResponse(ok(result))
          return
        }

        const result = await runExternalSignFlow({
          source: 'provider',
          request: req.request,
          senderUrl: undefined,
          waitForDecision: waitForExternalSignDecision,
          enqueueReview: async (pending) => {
            await addPendingDappRequest(pending)
          },
          openPopup: async () => {
            await openApprovalPopup()
          },
        })
        sendResponse(ok(result as ExternalSignResult))
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

      case 'DAPP_OPEN_SIGN_REQUEST': {
        const req = message.payload as DappOpenSignRequestPayload
        const allowed = await getDappPermissions(req.origin)
        if (!allowed.includes('getPublicKey')) {
          const approval = await requireDappApproval({ origin: req.origin, kind: 'getPublicKey' })
          if (!approval.approved)
            throw new BackendError('User rejected', { status: 403, code: 'user_rejected' })
          await setDappPermissions(req.origin, mergePermissions(allowed, 'getPublicKey'))
        }
        const query = buildSignRequestSearchParams(req.request)
        const url = chrome.runtime.getURL(`tabs/sign-request.html?${query}`)
        await chrome.tabs.create({ url })
        sendResponse(ok())
        return
      }

      case 'DAPP_SIGN_TRANSACTION': {
        const req = message.payload as {
          origin?: string
          request: {
            xdr: string
            network: 'testnet' | 'mainnet'
            accountToSign: string
            submit?: boolean
          }
        }
        const origin = req.origin ?? 'unknown'
        const allowed = await getDappPermissions(origin)
        if (!allowed.includes('getPublicKey')) {
          throw new BackendError('Site not connected — call getPublicKey first', {
            status: 403,
            code: 'not_connected',
          })
        }

        // #region agent log
        {
          const { accounts, activeAccountId } = await getAccounts()
          const active = accounts.find((a) => a.id === activeAccountId) ?? accounts[0]
          debugAgentLog({
            hypothesisId: 'H3',
            location: 'background/index.ts:DAPP_SIGN_TRANSACTION',
            message: 'dapp sign request vs active account',
            data: {
              origin,
              accountToSignSuffix: (req.request.accountToSign ?? '').slice(-8),
              activeSmartSuffix: (active?.smartAccountAddress ?? '').slice(-8),
              accountsMatch: req.request.accountToSign === active?.smartAccountAddress,
              activeMode: active?.mode ?? null,
              passkeyCredSuffix: (active?.passkeyCredentialId ?? '').slice(-12),
              hasPasskeyCred: Boolean(active?.passkeyCredentialId?.trim()),
              submit: req.request.submit,
            },
          })
        }
        // #endregion

        const flowResult = await runExternalSignFlow({
          source: 'provider',
          request: {
            network: req.request.network,
            smartAccountAddress: req.request.accountToSign,
            unsignedTxXdr: req.request.xdr,
            origin,
            submit: req.request.submit !== false,
          },
          senderUrl: undefined,
          waitForDecision: waitForExternalSignDecision,
          enqueueReview: async (pending) => {
            await addPendingDappRequest(pending)
          },
          openPopup: async () => {
            await openApprovalPopup()
          },
        })

        const response = mapExternalSignResultToProviderResponse(flowResult as ExternalSignResult)
        sendResponse(ok({ response }))
        return
      }

      case 'OPEN_WALLET_AFTER_ONBOARDING': {
        await chrome.storage.local.set({
          [STORAGE_KEYS.uiSurface]: 'sidepanel' satisfies UiSurfacePreference,
        })
        await ensureSetupStateMatchesAccounts()
        await applyActionClickBehavior()
        sendResponse(ok())
        return
      }

      case 'OPEN_ONBOARDING_TAB': {
        await openOnboardingTab()
        sendResponse(ok())
        return
      }

      default: {
        const type = message?.type ?? 'unknown'
        console.warn('[latch:background] unhandled message', type)
        sendResponse({
          ok: false,
          error: {
            message: `Unhandled background message: ${String(type)}`,
            code: 'unhandled_message',
          },
        } satisfies BackgroundResponse)
        return
      }
    }
  })().catch((err) => {
    sendResponse({ ok: false, error: toSerializableError(err) } satisfies BackgroundResponse)
  })

  return true // keep channel open for async responses
})

void initExtensionActionBehavior()

export {}
