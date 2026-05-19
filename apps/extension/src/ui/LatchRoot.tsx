import '../style.css'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type {
  BackgroundMessage,
  BackgroundResponse,
  BackendWebauthnAuthenticationFinishResponse,
  BackendWebauthnBeginResponse,
  BackendWebauthnRegistrationFinishResponse,
  BuildDelegatedTxResponse,
  BuildSendTxRequest,
  BuildSendTxResponse,
  BuildTxResponse,
  SetupSendRulesRequest,
  SetupSendRulesResponse,
  CreateOrConnectFreighterRequest,
  CreateOrConnectFreighterResponse,
  CreateOrConnectPhantomRequest,
  CreateOrConnectPhantomResponse,
  GetAccountsResponse,
  GetSmartAccountBalancesRequest,
  GetSmartAccountBalancesResponse,
  GetSmartAccountTransactionsRequest,
  GetSmartAccountTransactionsResponse,
  GetAssetIconDataUrlsRequest,
  GetAssetIconDataUrlsResponse,
  GetSetupStateResponse,
  ImportMnemonicAccountRequest,
  ImportMnemonicAccountResponse,
  ListPendingDappRequestsResponse,
  MigrationDiscoverRequest,
  MigrationDiscovery,
  PendingDappRequest,
  SerializableError,
  SetSetupStateRequest,
  SetActiveAccountRequest,
  StoredAccount,
  SmartAccountBalanceRow,
  SignDelegatedGAuthEntryRequest,
  SignDelegatedGAuthEntryResponse,
  SubmitDelegatedTxRequest,
  SubmitPhantomTxRequest,
  SubmitTxResponse,
  SubmitWebauthnTxRequest,
  UnlockMnemonicVaultRequest,
} from '@latch/types'

import {
  isAllowed,
  isConnected,
  setAllowed,
  getAddress,
  signAuthEntry,
} from '@stellar/freighter-api'
import { Networks } from '@stellar/stellar-sdk'

import { normalizeDelegatedSignatureBase64 } from '../lib/delegatedAuthSubmit'
import { startAuthentication, startRegistration } from '@simplewebauthn/browser'
import bs58 from 'bs58'
import { ExternalLink, Menu } from 'lucide-react'

import logoUrl from 'url:../../assets/brand/latch-logo.svg'
import biometricsUrl from 'url:../../assets/icons/biometrics.svg'
import successAvatarUrl from 'url:../../assets/avatars/success.png'

import { SectionCard } from './components/SectionCard'
import { HistoryScreen } from './screens/history/HistoryScreen'
import { HomeScreen } from './screens/HomeScreen'
import { ImportSeedScreen } from './screens/import-seed/ImportSeedScreen'
import { useSeedPhraseWords } from './screens/import-seed/useSeedPhraseWords'
import { TransactionDetailScreen } from './screens/transaction-detail/TransactionDetailScreen'
import { MigrationScreen } from './screens/MigrationScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { SwapScreen } from './screens/SwapScreen'
import { ConfirmSwapScreen } from './screens/ConfirmSwapScreen'
import { AccountMenu } from './components/AccountMenu'
import { storedAccountLabel } from './lib/storedAccountLabel'

import {
  assertBeginOptionsRpIdMatchesExtension,
  buildPasskeySigDataXdrFromAssertion,
  enrichWebauthnRpIdHashErrorMessage,
  formatWebauthnBrowserError,
  nextPasskeyAccountDisplayName,
  passkeyAuthenticationOptionsForAuthDigest,
} from './webauthn/passkey'
import { openPasskeyBridgeAndWait } from './webauthn/passkeyBridge'
import { bytesToHex } from './webauthn/utils'
import type { SwapDraft, SwapQuoteVm } from './swap/swapVm'
import { swapTokens } from './swap/swapVm'
import {
  buildTransactionDetail,
  groupHistoryItems,
  iconUrlForCode,
  mapTransactionToHistoryItem,
} from './lib/historyFormat'
import type { HistorySectionVm } from './types/history'
import type { TransactionDetailVm } from './types/transaction-detail'
import { INITIAL_SEND_DRAFT, type SendDraft, type SendResult, type SendStep } from './types/send'
import { SendFlow } from './screens/send/SendFlow'
import {
  buildSendRequestFromDraft,
  buildSetupRequestFromDraft,
  contextRuleIdString,
  isDelegatedSendBuild,
  isNoContextRuleError,
  passkeySetupPrerequisiteError,
} from './lib/sendTx'

type Theme = 'dark' | 'light'
type Surface = 'popup' | 'sidepanel'
type UiSurfacePreference = 'popup' | 'sidepanel'
type Page = 'main' | 'settings'

type Route =
  | 'welcome'
  | 'chooseSigner'
  | 'createPasskey'
  | 'passkeyCreated'
  | 'addAccount'
  | 'addAccountPasskey'
  | 'importSeed'
  | 'importSeedEncrypt'
  | 'unlockMnemonic'
  | 'home'
  | 'history'
  | 'transactionDetail'
  | 'swap'
  | 'swapConfirm'
  | 'send'
  | 'dappApproval'
  | 'migration'
  | 'migrationSuccess'

type SignerId = 'freighter' | 'phantom' | 'passkey'

/**
 * WebAuthn must run in the same document update as the user click as much as possible.
 * The global loading screen replaces route content and unmounts the button; Chrome (esp. side panel) then drops transient activation, so the passkey sheet never appears.
 */
function routeKeepsUiMountedForWebauthn(route: Route): boolean {
  return route === 'createPasskey' || route === 'addAccountPasskey' || route === 'send'
}

const STORAGE_KEYS = {
  theme: 'latch.theme',
  uiSurface: 'latch.uiSurface',
} as const

async function sendToBackground<TPayload, TData>(
  message: BackgroundMessage<TPayload>
): Promise<BackgroundResponse<TData>> {
  return (await chrome.runtime.sendMessage(message)) as BackgroundResponse<TData>
}

function readAddressFromFreighterGetAddressResult(v: unknown): string | undefined {
  if (typeof v === 'string') return v
  if (typeof v === 'object' && v) {
    const maybe = v as { address?: unknown }
    if (typeof maybe.address === 'string') return maybe.address
  }
  return undefined
}

type PhantomSolanaProvider = {
  connect: () => Promise<{ publicKey?: { toBase58?: () => string } } | undefined>
  publicKey?: { toBase58?: () => string }
  signMessage: (msg: Uint8Array) => Promise<{ signature?: Uint8Array } | Uint8Array>
}

function useTheme() {
  const [theme, setTheme] = useState<Theme>('dark')

  useEffect(() => {
    chrome.storage.local
      .get([STORAGE_KEYS.theme])
      .then((res) => {
        const t = res[STORAGE_KEYS.theme]
        if (t === 'light' || t === 'dark') setTheme(t)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('theme-light', theme === 'light')
    void chrome.storage.local.set({ [STORAGE_KEYS.theme]: theme })
  }, [theme])

  return { theme, setTheme }
}

function useUiSurfacePreference() {
  const [pref, setPref] = useState<UiSurfacePreference>('popup')

  useEffect(() => {
    chrome.storage.local
      .get([STORAGE_KEYS.uiSurface])
      .then((res) => {
        const v = res[STORAGE_KEYS.uiSurface]
        if (v === 'popup' || v === 'sidepanel') setPref(v)
      })
      .catch(() => {})
  }, [])

  const persist = (v: UiSurfacePreference) => {
    setPref(v)
    void chrome.storage.local.set({ [STORAGE_KEYS.uiSurface]: v })
  }

  return { pref, setPref: persist }
}

function IconButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={[
        'h-8 w-8 rounded-full border border-border bg-surface/40 text-fg/80',
        'grid place-items-center hover:bg-surface/60 active:bg-surface/80',
        props.className ?? '',
      ].join(' ')}
    />
  )
}

const headerIconClass = 'h-[18px] w-[18px]'

async function openSidePanel() {
  if (!('sidePanel' in chrome)) return
  const win = await chrome.windows.getLastFocused()
  if (!win?.id) return
  await chrome.sidePanel.open({ windowId: win.id })
}

async function setDefaultSurface(pref: UiSurfacePreference) {
  await chrome.storage.local.set({ [STORAGE_KEYS.uiSurface]: pref })
}

function friendlyError(e?: SerializableError): string {
  if (!e) return 'Unknown error'
  if (e.code === 'timeout') return 'Request timed out. Please try again.'
  if (e.status === 403) return 'Not authorized.'
  if (e.code === 'mnemonic_locked') {
    return 'Seed signer is not loaded. Unlock with your saved password or re-import your recovery phrase.'
  }
  return e.message
}

export function LatchRoot({ surface }: { surface: Surface }) {
  /**
   * Chrome does not reliably run WebAuthn inside the extension side panel (hangs with no UI).
   * Popup uses in-page credentials; side panel opens the shared `tabs/passkey-bridge` window.
   */
  async function webauthnCredential(mode: 'registration' | 'authentication', optionsJSON: unknown): Promise<unknown> {
    try {
      if (surface === 'sidepanel') {
        return await openPasskeyBridgeAndWait({ mode, optionsJSON })
      }
      if (mode === 'registration') {
        return await startRegistration({
          optionsJSON,
        } as unknown as Parameters<typeof startRegistration>[0])
      }
      return await startAuthentication({
        optionsJSON,
      } as unknown as Parameters<typeof startAuthentication>[0])
    } catch (e) {
      throw new Error(formatWebauthnBrowserError(e))
    }
  }

  const { theme, setTheme } = useTheme()
  const { pref, setPref } = useUiSurfacePreference()

  // Product direction: ship passkey-only for now, but keep other signer integrations ready to re-enable.
  const ENABLE_OTHER_SIGNERS = false

  const [route, setRoute] = useState<Route>('welcome')
  /** True when `chooseSigner` was opened from "I Have a Wallet" (passkey should authenticate, not register). */
  const [chooseSignerForExistingWallet, setChooseSignerForExistingWallet] = useState(false)
  const [page, setPage] = useState<Page>('main')
  const [selectedSigner, setSelectedSigner] = useState<SignerId>('passkey')

  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [setupState, setSetupState] = useState<GetSetupStateResponse['setupState']>('new')
  const [accounts, setAccounts] = useState<StoredAccount[]>([])
  const [activeAccountId, setActiveAccountId] = useState<string | undefined>(undefined)
  const [pendingDappRequests, setPendingDappRequests] = useState<PendingDappRequest[]>([])

  const activeAccount = useMemo(
    () => accounts.find((a) => a.id === activeAccountId) ?? accounts[0],
    [accounts, activeAccountId]
  )

  const activeAccountLabel = useMemo(() => {
    if (!activeAccount) return 'Account'
    const i = accounts.findIndex((x) => x.id === activeAccount.id)
    return storedAccountLabel(activeAccount, i >= 0 ? i : 0)
  }, [accounts, activeAccount])

  const [renameAccountId, setRenameAccountId] = useState<string | null>(null)
  const [renameDraft, setRenameDraft] = useState('')

  const [builtTx, setBuiltTx] = useState<BuildTxResponse | null>(null)
  const [builtDelegatedTx, setBuiltDelegatedTx] = useState<BuildDelegatedTxResponse | null>(null)
  const [swapDraft, setSwapDraft] = useState<SwapDraft | null>(null)
  const [swapQuote, setSwapQuote] = useState<SwapQuoteVm | null>(null)

  const [sendStep, setSendStep] = useState<SendStep>('selectToken')
  const [sendDraft, setSendDraft] = useState<SendDraft>(INITIAL_SEND_DRAFT)
  const [sendResult, setSendResult] = useState<SendResult | null>(null)
  const [sendProgressLabel, setSendProgressLabel] = useState<string | null>(null)
  const [sendError, setSendError] = useState<string | null>(null)

  const [activeAccountHasMnemonicVault, setActiveAccountHasMnemonicVault] = useState(false)
  const [activeAccountMnemonicSignerLoaded, setActiveAccountMnemonicSignerLoaded] = useState(false)
  const [unlockReturnRoute, setUnlockReturnRoute] = useState<'home' | 'migration' | null>(null)
  const [portfolioRows, setPortfolioRows] = useState<SmartAccountBalanceRow[]>([])
  const [totalBalanceUsd, setTotalBalanceUsd] = useState<string | null>(null)
  const [portfolioLoading, setPortfolioLoading] = useState(false)
  const [portfolioError, setPortfolioError] = useState<string | null>(null)
  const [historySections, setHistorySections] = useState<HistorySectionVm[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [transactionDetail, setTransactionDetail] = useState<TransactionDetailVm | null>(null)
  const [importSeedStep, setImportSeedStep] = useState<'phrase' | 'encrypt'>('phrase')
  const [pendingMnemonic, setPendingMnemonic] = useState('')
  const seedWords = useSeedPhraseWords()
  const [migrationDiscovery, setMigrationDiscovery] = useState<MigrationDiscovery | null | undefined>(undefined)
  const [seedExtensionPassphrase, setSeedExtensionPassphrase] = useState('')
  const [seedEncryptionPassword, setSeedEncryptionPassword] = useState('')
  const [seedEncryptionConfirm, setSeedEncryptionConfirm] = useState('')
  const [unlockVaultPassword, setUnlockVaultPassword] = useState('')

  const homePortfolioTokens = useMemo(
    () =>
      portfolioRows.map((r) => ({
        id: r.sacContractId,
        symbol: r.code,
        balance: r.amount,
        balanceUsd: r.balanceUsd ?? null,
        iconUrl: r.iconUrl,
      })),
    [portfolioRows],
  )

  const networkLabel =
    process.env.PLASMO_PUBLIC_STELLAR_NETWORK === 'mainnet' ? 'Stellar Mainnet' : 'Stellar Testnet'

  const [swapIconByCode, setSwapIconByCode] = useState<Record<string, string | null>>({})

  useEffect(() => {
    if (setupState !== 'has_account') return
    let cancelled = false
    void (async () => {
      const res = await sendToBackground<GetAssetIconDataUrlsRequest, GetAssetIconDataUrlsResponse>({
        type: 'GET_ASSET_ICON_DATA_URLS',
        payload: { assets: swapTokens.map((t) => ({ code: t.symbol })) },
      })
      if (cancelled || !res.ok || !res.data) return
      const map: Record<string, string | null> = {}
      swapTokens.forEach((t, i) => {
        map[t.symbol] = res.data!.icons[i] ?? null
      })
      setSwapIconByCode(map)
    })()
    return () => {
      cancelled = true
    }
  }, [setupState])

  const swapTokenCatalog = useMemo(() => {
    return swapTokens.map((t) => {
      const fromPortfolio = portfolioRows.find((r) => r.code === t.symbol)?.iconUrl
      const fromResolver = swapIconByCode[t.symbol]
      return {
        ...t,
        iconUrl: fromPortfolio ?? fromResolver ?? null,
      }
    })
  }, [portfolioRows, swapIconByCode])

  /** Prefetch WebAuthn `/begin` so the Create / Continue click does not await the network before credentials (side panel + gesture timing). */
  const passkeyPrefetchRef = useRef<
    | { kind: 'registration'; optionsJSON: unknown; displayName: string }
    | { kind: 'authentication'; optionsJSON: unknown }
    | null
  >(null)
  const [passkeyPrefetchReady, setPasskeyPrefetchReady] = useState(false)
  const [passkeyPrefetchError, setPasskeyPrefetchError] = useState<string | null>(null)
  const [passkeyPrefetchNonce, setPasskeyPrefetchNonce] = useState(0)

  useEffect(() => {
    if (setupState !== 'has_account') {
      setMigrationDiscovery(undefined)
      return
    }
    if (page !== 'main') return
    const acc = accounts.find((a) => a.id === activeAccountId) ?? accounts[0]
    if (!acc?.id || acc.mode !== 'mnemonic' || !acc.gAddress?.trim() || !acc.smartAccountAddress?.trim()) {
      setMigrationDiscovery(null)
      return
    }
    let cancelled = false
    void (async () => {
      const res = await sendToBackground<MigrationDiscoverRequest, MigrationDiscovery>({
        type: 'MIGRATION_DISCOVER',
        payload: { accountId: acc.id },
      })
      if (cancelled) return
      if (res.ok && res.data) setMigrationDiscovery(res.data)
      else setMigrationDiscovery(null)
    })()
    return () => {
      cancelled = true
    }
  }, [setupState, page, activeAccountId, accounts])

  useEffect(() => {
    if (route !== 'createPasskey' && route !== 'addAccountPasskey') {
      passkeyPrefetchRef.current = null
      setPasskeyPrefetchReady(false)
      setPasskeyPrefetchError(null)
      return
    }

    let cancelled = false
    setPasskeyPrefetchReady(false)
    setPasskeyPrefetchError(null)
    passkeyPrefetchRef.current = null

    void (async () => {
      try {
        if (route === 'createPasskey') {
          const displayName = nextPasskeyAccountDisplayName(accounts)
          const begin = await sendToBackground<{ displayName?: string }, BackendWebauthnBeginResponse>({
            type: 'PASSKEY_REG_BEGIN',
            payload: { displayName },
          })
          if (cancelled) return
          if (!begin.ok) throw new Error(friendlyError(begin.error))
          const optionsJSON = (begin.data as BackendWebauthnBeginResponse | undefined)?.options
          assertBeginOptionsRpIdMatchesExtension(optionsJSON)
          passkeyPrefetchRef.current = { kind: 'registration', optionsJSON, displayName }
        } else {
          const begin = await sendToBackground<undefined, BackendWebauthnBeginResponse>({
            type: 'PASSKEY_AUTH_BEGIN',
            payload: undefined,
          })
          if (cancelled) return
          if (!begin.ok) throw new Error(friendlyError(begin.error))
          const optionsJSON = begin.data?.options
          assertBeginOptionsRpIdMatchesExtension(optionsJSON)
          passkeyPrefetchRef.current = { kind: 'authentication', optionsJSON }
        }
        if (!cancelled) setPasskeyPrefetchReady(true)
      } catch (e) {
        if (!cancelled) {
          setPasskeyPrefetchError(e instanceof Error ? e.message : String(e))
          passkeyPrefetchRef.current = null
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [route, accounts, passkeyPrefetchNonce])

  useEffect(() => {
    void sendToBackground<undefined, GetSetupStateResponse>({
      type: 'GET_SETUP_STATE',
      payload: undefined,
    })
      .then((res) => {
        if (res.ok && res.data) setSetupState(res.data.setupState)
      })
      .catch(() => {})

    void sendToBackground<undefined, GetAccountsResponse>({
      type: 'GET_ACCOUNTS',
      payload: undefined,
    })
      .then((res) => {
        if (!res.ok || !res.data) return
        setAccounts(res.data.accounts)
        setActiveAccountId(res.data.activeAccountId)
        setActiveAccountHasMnemonicVault(Boolean(res.data.activeAccountHasMnemonicVault))
        setActiveAccountMnemonicSignerLoaded(Boolean(res.data.activeAccountMnemonicSignerLoaded))
        if (res.data.accounts.length > 0) setRoute('home')
      })
      .catch(() => {})

    void loadPendingDapp().catch(() => {})
  }, [])

  useEffect(() => {
    if (setupState === 'has_account' && accounts.length > 0) setRoute('home')
  }, [setupState, accounts.length])

  async function persistSetupHasAccount(publicKey: string) {
    const req: SetSetupStateRequest = { setupState: 'has_account', accountPublicKey: publicKey }
    await sendToBackground<SetSetupStateRequest, unknown>({ type: 'SET_SETUP_STATE', payload: req })
    setSetupState('has_account')
  }

  async function refreshAccounts(): Promise<StoredAccount[] | undefined> {
    const res = await sendToBackground<undefined, GetAccountsResponse>({
      type: 'GET_ACCOUNTS',
      payload: undefined,
    })
    if (!res.ok || !res.data) return undefined
    setAccounts(res.data.accounts)
    setActiveAccountId(res.data.activeAccountId)
    setActiveAccountHasMnemonicVault(Boolean(res.data.activeAccountHasMnemonicVault))
    setActiveAccountMnemonicSignerLoaded(Boolean(res.data.activeAccountMnemonicSignerLoaded))
    return res.data.accounts
  }

  const loadPortfolio = useCallback(async () => {
    const acc = accounts.find((a) => a.id === activeAccountId) ?? accounts[0]
    if (!acc?.id || !acc.smartAccountAddress?.trim()) {
      setPortfolioRows([])
      setPortfolioError(null)
      return
    }
    setPortfolioLoading(true)
    setPortfolioError(null)
    try {
      const res = await sendToBackground<GetSmartAccountBalancesRequest, GetSmartAccountBalancesResponse>({
        type: 'GET_SMART_ACCOUNT_BALANCES',
        payload: { accountId: acc.id },
      })
      if (!res.ok) {
        setPortfolioError(res.error?.message ?? 'Could not load balances')
        setPortfolioRows([])
        return
      }
      setPortfolioRows(res.data?.rows ?? [])
      setTotalBalanceUsd(res.data?.totalBalanceUsd ?? null)
    } finally {
      setPortfolioLoading(false)
    }
  }, [accounts, activeAccountId])

  const loadHistory = useCallback(async () => {
    const acc = accounts.find((a) => a.id === activeAccountId) ?? accounts[0]
    if (!acc?.id) {
      setHistorySections([])
      return
    }
    setHistoryLoading(true)
    setHistoryError(null)
    try {
      const res = await sendToBackground<
        GetSmartAccountTransactionsRequest,
        GetSmartAccountTransactionsResponse
      >({
        type: 'GET_SMART_ACCOUNT_TRANSACTIONS',
        payload: { accountId: acc.id },
      })
      if (!res.ok) {
        setHistoryError(res.error?.message ?? 'Could not load transactions')
        setHistorySections([])
        return
      }
      const items = (res.data?.items ?? []).map((row) =>
        mapTransactionToHistoryItem(row, iconUrlForCode(portfolioRows, row.assetCode)),
      )
      setHistorySections(groupHistoryItems(items))
    } finally {
      setHistoryLoading(false)
    }
  }, [accounts, activeAccountId, portfolioRows])

  useEffect(() => {
    if (setupState !== 'has_account' || page !== 'main' || route !== 'home') return
    void loadPortfolio()
  }, [setupState, page, route, loadPortfolio, activeAccountId])

  useEffect(() => {
    if (route !== 'history') return
    void loadHistory()
  }, [route, loadHistory])

  async function loadPendingDapp() {
    const res = await sendToBackground<unknown, ListPendingDappRequestsResponse>({
      type: 'LIST_PENDING_DAPP_REQUESTS',
      payload: {},
    })
    if (!res.ok || !res.data) return
    setPendingDappRequests(res.data.requests)
    if (res.data.requests.length > 0) setRoute('dappApproval')
  }

  async function connectFreighter() {
    setError(null)
    setLoading('Connecting to Freighter…')
    try {
      const ok = await isConnected()
      if (!ok) throw new Error('Freighter not detected. Please install the Freighter extension.')

      const allowed = await isAllowed()
      if (!allowed) await setAllowed()

      const g = (await getAddress()) as unknown
      const gAddress = readAddressFromFreighterGetAddressResult(g)
      if (!gAddress) throw new Error('Failed to read Freighter address.')
      const res = await sendToBackground<
        CreateOrConnectFreighterRequest,
        CreateOrConnectFreighterResponse & { account: StoredAccount }
      >({
        type: 'CREATE_OR_CONNECT_FREIGHTER',
        payload: { gAddress },
      })
      if (!res.ok) throw new Error(friendlyError(res.error))
      await persistSetupHasAccount(res.data!.smartAccountAddress)
      await refreshAccounts()
      setRoute('home')
    } finally {
      setLoading(null)
    }
  }

  async function connectPhantom() {
    setError(null)
    setLoading('Connecting to Phantom…')
    try {
      const provider = (window as unknown as { phantom?: { solana?: PhantomSolanaProvider } }).phantom?.solana
      if (!provider) throw new Error('Phantom not detected. Please install Phantom.')

      const conn = await provider.connect()
      const base58Pk = conn?.publicKey?.toBase58?.() ?? provider.publicKey?.toBase58?.()
      if (!base58Pk) throw new Error('Failed to read Phantom public key.')
      const pkBytes = bs58.decode(base58Pk)
      const publicKeyHex = bytesToHex(pkBytes)

      const res = await sendToBackground<
        CreateOrConnectPhantomRequest,
        CreateOrConnectPhantomResponse & { account: StoredAccount }
      >({
        type: 'CREATE_OR_CONNECT_PHANTOM',
        payload: { publicKeyHex },
      })
      if (!res.ok) throw new Error(friendlyError(res.error))
      await persistSetupHasAccount(res.data!.smartAccountAddress)
      await refreshAccounts()
      setRoute('home')
    } finally {
      setLoading(null)
    }
  }

  async function beginMnemonicImport() {
    setError(null)
    setLoading('Importing wallet…')
    try {
      const req: ImportMnemonicAccountRequest = {
        mnemonic: pendingMnemonic,
        bip39Passphrase: seedExtensionPassphrase || undefined,
        remember: true,
        encryptionPassword: seedEncryptionPassword,
      }
      const res = await sendToBackground<ImportMnemonicAccountRequest, ImportMnemonicAccountResponse>({
        type: 'IMPORT_MNEMONIC_ACCOUNT',
        payload: req,
      })
      if (!res.ok) throw new Error(friendlyError(res.error))
      await persistSetupHasAccount(res.data!.smartAccountAddress)
      await refreshAccounts()
      seedWords.reset()
      setPendingMnemonic('')
      setSeedExtensionPassphrase('')
      setSeedEncryptionPassword('')
      setSeedEncryptionConfirm('')
      setImportSeedStep('phrase')
      setRoute('home')
    } finally {
      setLoading(null)
    }
  }

  async function unlockMnemonicVault() {
    if (!activeAccount?.id) throw new Error('No active account')
    setError(null)
    setLoading('Unlocking…')
    try {
      const res = await sendToBackground<UnlockMnemonicVaultRequest, undefined>({
        type: 'UNLOCK_MNEMONIC_VAULT',
        payload: { accountId: activeAccount.id, encryptionPassword: unlockVaultPassword },
      })
      if (!res.ok) throw new Error(friendlyError(res.error))
      setUnlockVaultPassword('')
      await refreshAccounts()
      const dest = unlockReturnRoute ?? 'home'
      setUnlockReturnRoute(null)
      setRoute(dest)
    } finally {
      setLoading(null)
    }
  }

  async function beginPasskeyRegistration() {
    setError(null)
    setLoading('Creating passkey…')
    try {
      const pre = passkeyPrefetchRef.current
      if (!pre || pre.kind !== 'registration') {
        throw new Error(
          passkeyPrefetchError ??
            (passkeyPrefetchReady
              ? 'Passkey session is stale. Use Go Back, then return to Create Passkey.'
              : 'Still preparing passkey…')
        )
      }
      const optionsJSON = pre.optionsJSON
      assertBeginOptionsRpIdMatchesExtension(optionsJSON)
      const reg = (await webauthnCredential('registration', optionsJSON)) as Awaited<
        ReturnType<typeof startRegistration>
      >
      const res = await sendToBackground<
        { response: unknown },
        BackendWebauthnRegistrationFinishResponse & { account: StoredAccount }
      >({
        type: 'PASSKEY_REG_FINISH',
        payload: { response: reg },
      })
      if (!res.ok) {
        const errMsg = friendlyError(res.error)
        throw new Error(
          await enrichWebauthnRpIdHashErrorMessage(errMsg, { optionsJSON, credentialResponse: reg })
        )
      }
      await persistSetupHasAccount(res.data!.smartAccountAddress)
      await refreshAccounts()
      setRoute('passkeyCreated')
    } catch (e) {
      setPasskeyPrefetchNonce((n) => n + 1)
      throw e
    } finally {
      setLoading(null)
    }
  }

  async function loginWithExistingPasskey() {
    setError(null)
    setLoading('Logging in with passkey…')
    try {
      const pre = passkeyPrefetchRef.current
      if (!pre || pre.kind !== 'authentication') {
        throw new Error(
          passkeyPrefetchError ??
            (passkeyPrefetchReady
              ? 'Passkey session is stale. Use Go Back, then try again.'
              : 'Still preparing passkey…')
        )
      }
      const optionsJSON = pre.optionsJSON
      assertBeginOptionsRpIdMatchesExtension(optionsJSON)
      const assertion = (await webauthnCredential('authentication', optionsJSON)) as Awaited<
        ReturnType<typeof startAuthentication>
      >
      const finish = await sendToBackground<{ response: unknown }, BackendWebauthnAuthenticationFinishResponse>({
        type: 'PASSKEY_AUTH_FINISH',
        payload: { response: assertion },
      })
      if (!finish.ok) {
        const errMsg = friendlyError(finish.error)
        throw new Error(
          await enrichWebauthnRpIdHashErrorMessage(errMsg, { optionsJSON, credentialResponse: assertion })
        )
      }

      await persistSetupHasAccount(finish.data!.smartAccountAddress)
      await refreshAccounts()
      setChooseSignerForExistingWallet(false)
      setRoute('home')
    } catch (e) {
      setPasskeyPrefetchNonce((n) => n + 1)
      throw e
    } finally {
      setLoading(null)
    }
  }

  async function buildForActiveAccount() {
    if (!activeAccount) throw new Error('No active account')
    if (!activeAccount.smartAccountAddress) throw new Error('Account not ready')

    if (activeAccount.mode === 'freighter' || activeAccount.mode === 'mnemonic') {
      if (!activeAccount.gAddress) throw new Error('Missing G-address for delegated account')
      const res = await sendToBackground<
        { smartAccountAddress: string; gAddress: string },
        BuildDelegatedTxResponse
      >({
        type: 'BUILD_DELEGATED_TX',
        payload: {
          smartAccountAddress: activeAccount.smartAccountAddress,
          gAddress: activeAccount.gAddress,
        },
      })
      if (!res.ok) throw new Error(friendlyError(res.error))
      setBuiltDelegatedTx(res.data!)
      setBuiltTx(null)
      return res.data!
    }

    const res = await sendToBackground<
      { smartAccountAddress: string; signerG?: string },
      BuildTxResponse
    >({
      type: 'BUILD_TX',
      payload: {
        smartAccountAddress: activeAccount.smartAccountAddress,
        signerG: activeAccount.gAddress,
      },
    })
    if (!res.ok) throw new Error(friendlyError(res.error))
    setBuiltTx(res.data!)
    setBuiltDelegatedTx(null)
    return res.data!
  }

  function resetSendFlow() {
    setSendDraft(INITIAL_SEND_DRAFT)
    setSendStep('selectToken')
    setSendResult(null)
    setSendError(null)
    setSendProgressLabel(null)
  }

  function openSendFlow() {
    resetSendFlow()
    setRoute('send')
    void loadPortfolio()
  }

  function extractTransactionHash(data: SubmitTxResponse | null | undefined): string | undefined {
    if (!data) return undefined
    if (typeof data.transactionHash === 'string') return data.transactionHash
    if (typeof data.hash === 'string') return data.hash
    return undefined
  }

  async function signAndSubmitBuilt(build: BuildSendTxResponse): Promise<SubmitTxResponse> {
    if (!activeAccount) throw new Error('No active account')

    setSendProgressLabel('Signing…')

    if (
      (activeAccount.mode === 'freighter' || activeAccount.mode === 'mnemonic') &&
      isDelegatedSendBuild(build)
    ) {
      if (activeAccount.mode === 'freighter') {
        if (!activeAccount.gAddress) throw new Error('Missing G-address for freighter account')
        const networkPassphrase =
          process.env.PLASMO_PUBLIC_STELLAR_NETWORK === 'mainnet' ? Networks.PUBLIC : Networks.TESTNET
        if (!build.gAddressEntryTemplateXdr) {
          throw new Error('Missing delegated auth entry template from build response.')
        }
        const signed = await signAuthEntry(build.gAddressEntryTemplateXdr, {
          networkPassphrase,
          address: activeAccount.gAddress,
        })
        if (signed.error) throw new Error(signed.error.message ?? 'Freighter signing failed.')
        const signerAddress = signed.signerAddress
        const signedAuthEntryBase64 = signed.signedAuthEntry
          ? normalizeDelegatedSignatureBase64(signed.signedAuthEntry)
          : undefined
        if (!signedAuthEntryBase64 || !signerAddress) throw new Error('Freighter signing failed.')
        setSendProgressLabel('Submitting…')
        const submitRes = await sendToBackground<SubmitDelegatedTxRequest, SubmitTxResponse>({
          type: 'SUBMIT_TX_DELEGATED',
          payload: {
            txXdr: build.txXdr,
            smartAccountAuthEntryXdr: build.smartAccountAuthEntryXdr,
            gAddressEntryTemplateXdr: build.gAddressEntryTemplateXdr,
            signedAuthEntryBase64,
            signerAddress,
          },
        })
        if (!submitRes.ok) throw new Error(friendlyError(submitRes.error))
        return submitRes.data ?? {}
      }

      const signRes = await sendToBackground<
        SignDelegatedGAuthEntryRequest,
        SignDelegatedGAuthEntryResponse
      >({
        type: 'SIGN_DELEGATED_G_AUTH_ENTRY',
        payload: {
          accountId: activeAccount.id,
          gAddressEntryTemplateXdr: build.gAddressEntryTemplateXdr,
          networkPassphrase: Networks.TESTNET,
        },
      })
      if (!signRes.ok) throw new Error(friendlyError(signRes.error))
      setSendProgressLabel('Submitting…')
      const submitRes = await sendToBackground<SubmitDelegatedTxRequest, SubmitTxResponse>({
        type: 'SUBMIT_TX_DELEGATED',
        payload: {
          txXdr: build.txXdr,
          smartAccountAuthEntryXdr: build.smartAccountAuthEntryXdr,
          gAddressEntryTemplateXdr: build.gAddressEntryTemplateXdr,
          signedAuthEntryBase64: signRes.data!.signedAuthEntryBase64,
          signerAddress: signRes.data!.signerAddress,
        },
      })
      if (!submitRes.ok) throw new Error(friendlyError(submitRes.error))
      return submitRes.data ?? {}
    }

    if (activeAccount.mode === 'phantom') {
      const provider = (window as unknown as { phantom?: { solana?: PhantomSolanaProvider } }).phantom?.solana
      if (!provider) throw new Error('Phantom not detected.')
      const digest = build.authDigestHex.toLowerCase()
      const prefixedMessage = `Stellar Smart Account Auth:\n${digest}`
      const msgBytes = new TextEncoder().encode(prefixedMessage)
      const signed = await provider.signMessage(msgBytes)
      const sigBytes: Uint8Array = signed instanceof Uint8Array ? signed : signed.signature ?? new Uint8Array()
      if (sigBytes.length === 0) throw new Error('Phantom signing failed.')
      setSendProgressLabel('Submitting…')
      const submitRes = await sendToBackground<SubmitPhantomTxRequest, SubmitTxResponse>({
        type: 'SUBMIT_TX_PHANTOM',
        payload: {
          txXdr: build.txXdr,
          authEntryXdr: build.authEntryXdr,
          authSignatureHex: bytesToHex(sigBytes),
          prefixedMessage,
          publicKeyHex: activeAccount.phantomPublicKeyHex ?? '',
          contextRuleId: contextRuleIdString(build),
        },
      })
      if (!submitRes.ok) throw new Error(friendlyError(submitRes.error))
      return submitRes.data ?? {}
    }

    if (!activeAccount.passkeyCredentialId || !activeAccount.passkeyKeyDataHex) {
      throw new Error('Missing passkey data for this account.')
    }
    if (!build.authDigestHex?.trim()) {
      throw new Error('Missing auth digest from transaction build.')
    }
    const optionsJSON = passkeyAuthenticationOptionsForAuthDigest({
      credentialId: activeAccount.passkeyCredentialId,
      authDigestHex: build.authDigestHex,
    })
    const assertion = (await webauthnCredential('authentication', optionsJSON)) as Awaited<
      ReturnType<typeof startAuthentication>
    >
    const sigDataXdr = buildPasskeySigDataXdrFromAssertion(assertion)
    setSendProgressLabel('Submitting…')
    const submitRes = await sendToBackground<SubmitWebauthnTxRequest, SubmitTxResponse>({
      type: 'SUBMIT_TX_WEBAUTHN',
      payload: {
        txXdr: build.txXdr,
        authEntryXdr: build.authEntryXdr,
        sigDataXdr,
        keyDataHex: activeAccount.passkeyKeyDataHex,
        contextRuleId: contextRuleIdString(build),
      },
    })
    if (!submitRes.ok) {
      const errMsg = friendlyError(submitRes.error)
      throw new Error(
        await enrichWebauthnRpIdHashErrorMessage(errMsg, { optionsJSON, credentialResponse: assertion })
      )
    }
    return submitRes.data ?? {}
  }

  async function executeSendWithSetupLoop(draft: SendDraft): Promise<SendResult> {
    if (!activeAccount) throw new Error('No active account')
    const buildBody = buildSendRequestFromDraft(draft, activeAccount)
    const setupBody = buildSetupRequestFromDraft(draft, activeAccount)
    if (!buildBody) throw new Error('Invalid send details')
    if (!setupBody) {
      throw new Error(passkeySetupPrerequisiteError(activeAccount) ?? 'Invalid send details')
    }

    for (let attempt = 0; attempt < 5; attempt++) {
      setSendProgressLabel('Building…')
      const buildRes = await sendToBackground<BuildSendTxRequest, BuildSendTxResponse>({
        type: 'BUILD_SEND_TX',
        payload: buildBody,
      })

      if (buildRes.ok && buildRes.data) {
        const submitData = await signAndSubmitBuilt(buildRes.data)
        return {
          status: 'success',
          hash: extractTransactionHash(submitData),
          submittedAt: new Date().toISOString(),
        }
      }

      if (isNoContextRuleError(buildRes.error)) {
        setSendProgressLabel('Setting up…')
        const setupRes = await sendToBackground<SetupSendRulesRequest, SetupSendRulesResponse>({
          type: 'SETUP_SEND_RULES',
          payload: setupBody,
        })
        if (!setupRes.ok) throw new Error(friendlyError(setupRes.error))
        const setup = setupRes.data!
        if (setup.alreadyConfigured) continue
        await signAndSubmitBuilt(setup)
        if ((setup.remainingSetupCount ?? 0) > 0) continue
        continue
      }

      throw new Error(friendlyError(buildRes.error))
    }

    throw new Error('Send setup did not complete')
  }

  async function fetchSendFeeEstimate(): Promise<BuildSendTxResponse | null> {
    if (!activeAccount) return null
    const buildBody = buildSendRequestFromDraft(sendDraft, activeAccount)
    if (!buildBody) return null
    try {
      const buildRes = await sendToBackground<BuildSendTxRequest, BuildSendTxResponse>({
        type: 'BUILD_SEND_TX',
        payload: buildBody,
      })
      if (buildRes.ok && buildRes.data) return buildRes.data
      return null
    } catch {
      return null
    }
  }

  async function handleSubmitSend() {
    setSendError(null)
    setSendProgressLabel('Building…')
    try {
      const result = await executeSendWithSetupLoop(sendDraft)
      setSendResult(result)
      setSendStep('success')
      void loadPortfolio()
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      console.error('[latch:send]', message, e)
      setSendResult({
        status: 'failure',
        errorMessage: message,
        submittedAt: new Date().toISOString(),
      })
      setSendStep('failure')
    } finally {
      setSendProgressLabel(null)
    }
  }

  async function signAndSubmit(): Promise<string> {
    if (!activeAccount) throw new Error('No active account')
    setError(null)
    setLoading('Building transaction…')
    try {
      await buildForActiveAccount()

      if (activeAccount.mode === 'freighter') {
        if (!activeAccount.gAddress) throw new Error('Missing G-address for freighter account')
        const b =
          builtDelegatedTx ??
          (
            await sendToBackground<{ smartAccountAddress: string; gAddress: string }, BuildDelegatedTxResponse>({
              type: 'BUILD_DELEGATED_TX',
              payload: {
                smartAccountAddress: activeAccount.smartAccountAddress,
                gAddress: activeAccount.gAddress,
              },
            })
          ).data
        if (!b) throw new Error('Failed to build delegated transaction.')
        setLoading('Awaiting Freighter signature…')
        const networkPassphrase =
          process.env.PLASMO_PUBLIC_STELLAR_NETWORK === 'mainnet' ? Networks.PUBLIC : Networks.TESTNET
        if (!b.gAddressEntryTemplateXdr) {
          throw new Error('Missing delegated auth entry template from build response.')
        }
        const signed = await signAuthEntry(b.gAddressEntryTemplateXdr, {
          networkPassphrase,
          address: activeAccount.gAddress,
        })
        if (signed.error) throw new Error(signed.error.message ?? 'Freighter signing failed.')
        const signerAddress = signed.signerAddress
        const signedAuthEntryBase64 = signed.signedAuthEntry
          ? normalizeDelegatedSignatureBase64(signed.signedAuthEntry)
          : undefined
        if (!signedAuthEntryBase64 || !signerAddress) throw new Error('Freighter signing failed.')

        setLoading('Submitting transaction…')
        const submitRes = await sendToBackground<SubmitDelegatedTxRequest, SubmitTxResponse>({
          type: 'SUBMIT_TX_DELEGATED',
          payload: {
            txXdr: b.txXdr,
            smartAccountAuthEntryXdr: b.smartAccountAuthEntryXdr,
            gAddressEntryTemplateXdr: b.gAddressEntryTemplateXdr,
            signedAuthEntryBase64,
            signerAddress,
          },
        })
        if (!submitRes.ok) throw new Error(friendlyError(submitRes.error))
        setRoute('home')
        return b.txXdr
      }

      if (activeAccount.mode === 'mnemonic') {
        if (!activeAccount.gAddress) throw new Error('Missing G-address for mnemonic account')
        const b =
          builtDelegatedTx ??
          (
            await sendToBackground<{ smartAccountAddress: string; gAddress: string }, BuildDelegatedTxResponse>({
              type: 'BUILD_DELEGATED_TX',
              payload: {
                smartAccountAddress: activeAccount.smartAccountAddress,
                gAddress: activeAccount.gAddress,
              },
            })
          ).data
        if (!b) throw new Error('Failed to build delegated transaction.')
        setLoading('Signing with local key…')
        const signRes = await sendToBackground<
          SignDelegatedGAuthEntryRequest,
          SignDelegatedGAuthEntryResponse
        >({
          type: 'SIGN_DELEGATED_G_AUTH_ENTRY',
          payload: {
            accountId: activeAccount.id,
            gAddressEntryTemplateXdr: b.gAddressEntryTemplateXdr,
            networkPassphrase: Networks.TESTNET,
          },
        })
        if (!signRes.ok) throw new Error(friendlyError(signRes.error))
        const signedAuthEntryBase64 = signRes.data!.signedAuthEntryBase64
        const signerAddress = signRes.data!.signerAddress

        setLoading('Submitting transaction…')
        const submitRes = await sendToBackground<SubmitDelegatedTxRequest, SubmitTxResponse>({
          type: 'SUBMIT_TX_DELEGATED',
          payload: {
            txXdr: b.txXdr,
            smartAccountAuthEntryXdr: b.smartAccountAuthEntryXdr,
            gAddressEntryTemplateXdr: b.gAddressEntryTemplateXdr,
            signedAuthEntryBase64,
            signerAddress,
          },
        })
        if (!submitRes.ok) throw new Error(friendlyError(submitRes.error))
        setRoute('home')
        return b.txXdr
      }

      if (activeAccount.mode === 'phantom') {
        const provider = (window as unknown as { phantom?: { solana?: PhantomSolanaProvider } }).phantom?.solana
        if (!provider) throw new Error('Phantom not detected.')
        const b =
          builtTx ??
          (
            await sendToBackground<{ smartAccountAddress: string; signerG?: string }, BuildTxResponse>({
              type: 'BUILD_TX',
              payload: {
                smartAccountAddress: activeAccount.smartAccountAddress,
                signerG: activeAccount.gAddress,
              },
            })
          ).data
        if (!b) throw new Error('Failed to build transaction.')

        const prefixedMessage = `Stellar Smart Account Auth:\n${b.authDigestHex.toLowerCase()}`
        const msgBytes = new TextEncoder().encode(prefixedMessage)
        setLoading('Awaiting Phantom signature…')
        const signed = await provider.signMessage(msgBytes)
        const sigBytes: Uint8Array = signed instanceof Uint8Array ? signed : signed.signature ?? new Uint8Array()
        if (sigBytes.length === 0) throw new Error('Phantom signing failed.')
        const authSignatureHex = bytesToHex(sigBytes)

        setLoading('Submitting transaction…')
        const submitRes = await sendToBackground<SubmitPhantomTxRequest, SubmitTxResponse>({
          type: 'SUBMIT_TX_PHANTOM',
          payload: {
            txXdr: b.txXdr,
            authEntryXdr: b.authEntryXdr,
            authSignatureHex,
            prefixedMessage,
            publicKeyHex: activeAccount.phantomPublicKeyHex ?? '',
            contextRuleId: b.contextRuleId,
          },
        })
        if (!submitRes.ok) throw new Error(friendlyError(submitRes.error))
        setRoute('home')
        return b.txXdr
      }

      // passkey
      const b =
        builtTx ??
        (
          await sendToBackground<{ smartAccountAddress: string; signerG?: string }, BuildTxResponse>({
            type: 'BUILD_TX',
            payload: {
              smartAccountAddress: activeAccount.smartAccountAddress,
              signerG: activeAccount.gAddress,
            },
          })
        ).data
      if (!b) throw new Error('Failed to build transaction.')
      if (!activeAccount.passkeyCredentialId || !activeAccount.passkeyKeyDataHex) {
        throw new Error('Missing passkey data for this account.')
      }

      if (!b.authDigestHex?.trim()) {
        throw new Error('Missing auth digest from transaction build.')
      }
      setLoading('Awaiting passkey authentication…')
      const optionsJSON = passkeyAuthenticationOptionsForAuthDigest({
        credentialId: activeAccount.passkeyCredentialId,
        authDigestHex: b.authDigestHex,
      })
      const assertion = (await webauthnCredential('authentication', optionsJSON)) as Awaited<
        ReturnType<typeof startAuthentication>
      >
      const sigDataXdr = buildPasskeySigDataXdrFromAssertion(assertion)

      setLoading('Submitting transaction…')
      const submitRes = await sendToBackground<SubmitWebauthnTxRequest, SubmitTxResponse>({
        type: 'SUBMIT_TX_WEBAUTHN',
        payload: {
          txXdr: b.txXdr,
          authEntryXdr: b.authEntryXdr,
          sigDataXdr,
          keyDataHex: activeAccount.passkeyKeyDataHex,
          contextRuleId: b.contextRuleId,
        },
      })
      if (!submitRes.ok) {
        const errMsg = friendlyError(submitRes.error)
        throw new Error(
          await enrichWebauthnRpIdHashErrorMessage(errMsg, { optionsJSON, credentialResponse: assertion })
        )
      }
      setRoute('home')
      return b.txXdr
    } finally {
      setLoading(null)
    }
  }

  async function resolvePendingDapp(
    req: PendingDappRequest,
    approved: boolean,
    signedXdr?: string
  ) {
    await sendToBackground({
      type: 'RESOLVE_PENDING_DAPP_REQUEST',
      payload: { requestId: req.id, approved, signedXdr },
    })
    await loadPendingDapp()
    if (pendingDappRequests.length <= 1) {
      setRoute(accounts.length > 0 ? 'home' : 'welcome')
    }
  }

  const sidepanelPreferenceSection = (
    <div className="mt-2">
      <SectionCard>
        <div className="text-base font-extrabold">Side panel</div>
        <div className="mt-1 text-xs text-muted">
          When enabled, clicking the Latch icon opens the side panel instead of the popup.
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="text-sm font-bold">Enable side panel</div>
          <button
            className={[
              'h-9 w-20 rounded-full border text-sm font-extrabold',
              pref === 'sidepanel' ? 'border-primary bg-primary text-black' : 'border-border bg-bg text-fg',
            ].join(' ')}
            onClick={() => {
              const next = pref === 'sidepanel' ? 'popup' : 'sidepanel'
              setPref(next)
              void setDefaultSurface(next).then(() => {
                if (next === 'sidepanel') void openSidePanel().catch(() => {})
              })
            }}
          >
            {pref === 'sidepanel' ? 'On' : 'Off'}
          </button>
        </div>
      </SectionCard>
    </div>
  )

  async function logout() {
    setError(null)
    setLoading('Logging out…')
    try {
      const res = await sendToBackground<undefined, undefined>({ type: 'LOGOUT', payload: undefined })
      if (!res.ok) throw new Error(friendlyError(res.error))
      setSetupState('new')
      setPendingDappRequests([])
      setRoute('welcome')
      setPage('main')
    } finally {
      setLoading(null)
    }
  }

  const containerClass =
    surface === 'sidepanel' ? 'h-screen w-full min-w-[320px]' : 'h-[600px] w-[360px]'
  const flowHeightClass = surface === 'sidepanel' ? 'flex-1 min-h-0' : 'h-[520px]'

  return (
    <div className={['bg-bg text-fg', containerClass].join(' ')}>
      <div
        className={[
          'relative h-full w-full',
          surface === 'sidepanel' ? 'px-6 pb-6 pt-5' : 'px-6 pb-6 pt-4',
        ].join(' ')}
      >
        <div className="flex items-center justify-between gap-2">
          {page === 'main' && (route === 'home' || route === 'migration') ? (
            <AccountMenu
              accountLabel={activeAccountLabel}
              accounts={accounts}
              activeAccountId={activeAccountId}
              onSelectAccount={(accountId) => {
                void sendToBackground<SetActiveAccountRequest, undefined>({
                  type: 'SET_ACTIVE_ACCOUNT',
                  payload: { accountId },
                })
                  .then(() => refreshAccounts())
                  .catch(() => {})
              }}
              onAddAccount={() => setRoute('addAccount')}
              onRenameAccount={(accountId) => {
                const idx = accounts.findIndex((a) => a.id === accountId)
                const acc = accounts[idx]
                if (!acc) return
                setRenameDraft(storedAccountLabel(acc, idx >= 0 ? idx : 0))
                setRenameAccountId(accountId)
              }}
            />
          ) : (
            <div className="h-10 w-10" />
          )}
          <div className="flex items-center justify-end gap-2">
            <IconButton
              aria-label="Menu"
              title="Menu"
              onClick={() => {
                setPage('settings')
              }}
            >
              <Menu className={headerIconClass} strokeWidth={2} aria-hidden />
            </IconButton>
          </div>
        </div>

        {page === 'settings' ? (
          <div className={['mt-4 flex min-h-0 flex-1 flex-col animate-screenIn', flowHeightClass].join(' ')}>
            <SettingsScreen
              accountName={activeAccountLabel}
              accountAddress={activeAccount?.smartAccountAddress ?? '—'}
              theme={theme}
              onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              biometricsEnabled={false}
              onChangeBiometricsEnabled={() => {}}
              sidepanelPreferenceSection={sidepanelPreferenceSection}
              onClose={() => setPage('main')}
              onLogout={() => void logout().catch((e) => setError(e instanceof Error ? e.message : String(e)))}
              onOpenMigrateAssets={
                activeAccount?.mode === 'mnemonic' &&
                activeAccount.gAddress?.trim() &&
                activeAccount.smartAccountAddress?.trim() &&
                migrationDiscovery?.state === 'not_started'
                  ? () => {
                      setPage('main')
                      setRoute('migration')
                    }
                  : undefined
              }
            />
          </div>
        ) : null}

        {page === 'main' ? (
          <>
            {loading && !routeKeepsUiMountedForWebauthn(route) ? (
              <div
                className={[
                  'mt-4 flex flex-col items-center justify-center animate-screenIn',
                  flowHeightClass,
                ].join(' ')}
              >
                <img src={logoUrl} alt="Latch" className="h-10 w-10 object-contain" />
                <div className="mt-6 text-center text-lg font-extrabold">{loading}</div>
                <div className="mt-2 text-center text-xs text-muted">
                  Approve the request in your wallet when prompted.
                </div>
                <button
                  className="mt-8 rounded-full border border-border px-4 py-2 text-sm font-bold hover:bg-surface/70"
                  onClick={() => setLoading(null)}
                >
                  Cancel
                </button>
              </div>
            ) : null}

            {error && (!loading || routeKeepsUiMountedForWebauthn(route)) ? (
              <div className="mt-4 rounded-2xl border border-border bg-surface/60 p-4 text-sm shadow-soft">
                <div className="font-extrabold">Something went wrong</div>
                <div className="mt-2 text-muted">{error}</div>
                <button
                  className="mt-4 rounded-full border border-border px-4 py-2 text-sm font-bold hover:bg-surface/70"
                  onClick={() => setError(null)}
                >
                  Dismiss
                </button>
              </div>
            ) : null}

            {!loading && route === 'dappApproval' ? (
              <div className={['mt-4 flex flex-col animate-screenIn', flowHeightClass].join(' ')}>
                <div className="text-center">
                  <img src={logoUrl} alt="Latch" className="mx-auto h-10 w-10 object-contain" />
                  <h2 className="mt-4 text-3xl font-extrabold tracking-tight">Dapp request</h2>
                  <p className="mt-2 text-sm text-muted">Approve access for this site</p>
                </div>

                {pendingDappRequests[0] ? (
                  <div className="mt-6 rounded-2xl border border-border bg-surface/60 p-4 shadow-soft">
                    <div className="text-xs font-bold text-muted">Origin</div>
                    <div className="mt-2 break-all text-sm font-extrabold">
                      {pendingDappRequests[0].origin}
                    </div>
                    <div className="mt-3 text-xs text-muted">Request</div>
                    <div className="mt-1 text-sm font-bold">{pendingDappRequests[0].kind}</div>
                  </div>
                ) : null}

                <div className="mt-auto space-y-3">
                  <button
                    onClick={() => {
                      const req = pendingDappRequests[0]
                      if (!req) return
                      void (async () => {
                        if (req.kind === 'signTransaction') {
                          const signedXdr = await signAndSubmit()
                          await resolvePendingDapp(req, true, signedXdr)
                          return
                        }
                        await resolvePendingDapp(req, true)
                      })().catch((e) => setError(e instanceof Error ? e.message : String(e)))
                    }}
                    className="h-12 w-full rounded-full bg-primary text-base font-extrabold text-black shadow-soft"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      const req = pendingDappRequests[0]
                      if (!req) return
                      void resolvePendingDapp(req, false).catch((e) =>
                        setError(e instanceof Error ? e.message : String(e))
                      )
                    }}
                    className="h-12 w-full rounded-full border border-border bg-surface text-base font-bold text-fg shadow-soft"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ) : null}

            {!loading && route === 'welcome' ? (
              <div
                className={[
                  'mt-3 flex flex-col items-center justify-between h-full pb-6 animate-screenIn',
                  flowHeightClass,
                ].join(' ')}
              >
                <div className="flex flex-col items-center">
                  <img src={logoUrl} alt="Latch" className="mt-4 h-10 w-10 object-contain" />
                  <h1 className="mt-8 text-center text-3xl font-extrabold tracking-tight">
                    Welcome to Latch
                  </h1>
                  <p className="mt-4 max-w-[280px] text-center text-sm text-muted">
                    Securely manage your digital assets with confidence and ease.
                  </p>
                </div>

                <div className="mt-auto w-full space-y-3">
                  {accounts.length > 0 ? (
                    <button
                      onClick={() => setRoute('home')}
                      className="h-12 w-full rounded-full border border-border bg-surface text-base font-bold text-fg shadow-soft"
                    >
                      Continue
                    </button>
                  ) : null}
                  <button
                    onClick={() => {
                      setChooseSignerForExistingWallet(false)
                      setRoute('chooseSigner')
                    }}
                    className="h-12 w-full rounded-full bg-primary text-base font-extrabold text-black shadow-soft"
                  >
                    Create a New Wallet
                  </button>
                  <button
                    onClick={() => {
                      setChooseSignerForExistingWallet(true)
                      setRoute('chooseSigner')
                    }}
                    className="h-12 w-full rounded-full border border-border bg-surface text-base font-bold text-fg shadow-soft"
                  >
                    I Have a Wallet
                  </button>
                  <button
                    type="button"
                    onClick={() => setRoute('importSeed')}
                    className="h-11 w-full rounded-full text-sm font-extrabold text-primary hover:underline"
                  >
                    Import with recovery phrase
                  </button>
                </div>
              </div>
            ) : null}

            {!loading && route === 'addAccount' ? (
              <div className={['mt-4 flex flex-col animate-screenIn', flowHeightClass].join(' ')}>
                <div className="text-center">
                  <img src={logoUrl} alt="Latch" className="mx-auto h-10 w-10 object-contain" />
                  <h2 className="mt-4 text-3xl font-extrabold tracking-tight">Add account</h2>
                  <p className="mt-2 text-sm text-muted">Choose how you want to add another signer</p>
                </div>

                <div className="mt-6 space-y-3 w-full">
                  <button
                    onClick={() => {
                      setChooseSignerForExistingWallet(false)
                      setRoute('addAccountPasskey')
                    }}
                    className="flex w-full items-center justify-between rounded-2xl border border-border bg-surface/60 px-4 py-4 text-left hover:bg-surface/70"
                  >
                    <div>
                      <div className="text-base font-extrabold">Passkey</div>
                      <div className="mt-1 text-xs text-muted">Log in with an existing passkey</div>
                    </div>
                    <ExternalLink className={headerIconClass} strokeWidth={2} aria-hidden />
                  </button>

                  <button
                    onClick={() => setRoute('importSeed')}
                    className="flex w-full items-center justify-between rounded-2xl border border-border bg-surface/60 px-4 py-4 text-left hover:bg-surface/70"
                  >
                    <div>
                      <div className="text-base font-extrabold">Recovery phrase</div>
                      <div className="mt-1 text-xs text-muted">Add a seed-based account</div>
                    </div>
                    <ExternalLink className={headerIconClass} strokeWidth={2} aria-hidden />
                  </button>
                </div>

                <div className="mt-auto space-y-3 w-full">
                  <button
                    onClick={() => setRoute('home')}
                    className="h-12 w-full rounded-full border border-border bg-surface text-base font-bold text-fg shadow-soft"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : null}

            {route === 'addAccountPasskey' ? (
              <div className={['mt-4 flex flex-col animate-screenIn', flowHeightClass].join(' ')}>
                <div className="text-center">
                  <img src={logoUrl} alt="Latch" className="mx-auto h-10 w-10 object-contain" />
                  <h2 className="mt-4 text-3xl font-extrabold tracking-tight">Passkey login</h2>
                  <p className="mt-2 text-sm text-muted">Use your existing passkey to connect</p>
                </div>

                {passkeyPrefetchError ? (
                  <div className="mt-4 rounded-2xl border border-border bg-surface/60 px-3 py-3 text-xs text-muted">
                    {passkeyPrefetchError}
                  </div>
                ) : null}

                <div className="mt-auto space-y-3 w-full">
                  <button
                    disabled={Boolean(loading) || !passkeyPrefetchReady}
                    onClick={() => void loginWithExistingPasskey().catch((e) => setError(e instanceof Error ? e.message : String(e)))}
                    className="h-12 w-full rounded-full bg-primary text-base font-extrabold text-black shadow-soft disabled:opacity-50"
                  >
                    {!passkeyPrefetchReady
                      ? 'Preparing…'
                      : loading
                        ? loading
                        : 'Continue with Passkey'}
                  </button>
                  <button
                    onClick={() => {
                      setLoading(null)
                      setRoute(chooseSignerForExistingWallet ? 'chooseSigner' : 'addAccount')
                    }}
                    className="h-12 w-full rounded-full border border-border bg-surface text-base font-bold text-fg shadow-soft"
                  >
                    Go Back
                  </button>
                </div>
              </div>
            ) : null}

            {!loading && route === 'chooseSigner' ? (
              <div className={['mt-4 flex flex-col animate-screenIn', flowHeightClass].join(' ')}>
                <div className="text-center">
                  <img src={logoUrl} alt="Latch" className="mx-auto h-10 w-10 object-contain" />
                  <h2 className="mt-4 text-3xl font-extrabold tracking-tight">Choose Signer</h2>
                  <p className="mt-2 text-sm text-muted">
                    {chooseSignerForExistingWallet
                      ? 'Pick how you usually unlock your Latch wallet.'
                      : 'Select a signer to secure your smart account'}
                  </p>
                </div>

                {/* Choose signer screen */}
                <div className="flex flex-col items-center space-y-3">
                  <div className="mt-6 space-y-3 w-full">
                    {(
                      ENABLE_OTHER_SIGNERS
                        ? ([
                            {
                              id: 'freighter',
                              name: 'Freighter',
                              subtitle: 'Browser extension wallet for Stellar',
                            },
                            { id: 'phantom', name: 'Phantom', subtitle: 'Wallet for message signing' },
                            {
                              id: 'passkey',
                              name: 'Passkey',
                              subtitle: 'Biometric WebAuthn signer (P-256)',
                            },
                          ] as const)
                        : ([
                            {
                              id: 'passkey',
                              name: 'Passkey',
                              subtitle: 'Biometric WebAuthn signer (P-256)',
                            },
                          ] as const)
                    ).map((s) => {
                      const active = s.id === selectedSigner
                      return (
                        <button
                          key={s.id}
                          onClick={() => setSelectedSigner(s.id)}
                          className={[
                            'flex w-full items-center justify-between rounded-2xl border px-4 py-4 text-left',
                            'bg-surface/60 hover:bg-surface/70',
                            active ? 'border-primary' : 'border-border',
                          ].join(' ')}
                        >
                          <div>
                            <div className="text-base font-extrabold">{s.name}</div>
                            <div className="mt-1 text-xs text-muted">{s.subtitle}</div>
                          </div>
                          <span className="text-fg/70">
                            <ExternalLink className={headerIconClass} strokeWidth={2} aria-hidden />
                          </span>
                        </button>
                      )
                    })}
                  </div>

                  <div className="mt-auto space-y-3 w-full">
                    {selectedSigner === 'passkey' ? (
                      <button
                        onClick={() =>
                          setRoute(chooseSignerForExistingWallet ? 'addAccountPasskey' : 'createPasskey')
                        }
                        className="h-12 w-full rounded-full bg-primary text-base font-extrabold text-black shadow-soft"
                      >
                        {chooseSignerForExistingWallet ? 'Log in with Passkey' : 'Continue with Passkey'}
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          void (
                            selectedSigner === 'freighter' ? connectFreighter() : connectPhantom()
                          ).catch((e) => setError(e instanceof Error ? e.message : String(e)))
                        }}
                        className="h-12 w-full rounded-full bg-primary text-base font-extrabold text-black shadow-soft"
                      >
                        Continue
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setChooseSignerForExistingWallet(false)
                        setRoute('welcome')
                      }}
                      className="h-12 w-full rounded-full border border-border bg-surface text-base font-bold text-fg shadow-soft"
                    >
                      Go Back
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            {route === 'createPasskey' ? (
              <div className={['mt-4 flex flex-col animate-screenIn', flowHeightClass].join(' ')}>
                <div className="text-center">
                  <img src={logoUrl} alt="Latch" className="mx-auto h-10 w-10 object-contain" />
                  <h2 className="mt-4 text-3xl font-extrabold tracking-tight">Create Passkey</h2>
                  <p className="mt-2 text-sm text-muted">Protect your account with biometrics</p>
                </div>

                <div className="mt-7 grid place-items-center">
                  <div className="grid h-24 w-24 place-items-center rounded-3xl bg-surface shadow-soft">
                    <img
                      src={biometricsUrl}
                      alt="Biometrics"
                      className="h-14 w-14 object-contain"
                    />
                  </div>
                </div>

                <div className="mt-7 rounded-2xl bg-surface/70 px-4 py-4 shadow-soft">
                  <div className="text-base font-extrabold">Biometric Security</div>
                  <div className="mt-1 text-xs text-muted">
                    Use your device&apos;s fingerprint or face recognition
                  </div>
                </div>

                {passkeyPrefetchError ? (
                  <div className="mt-4 rounded-2xl border border-border bg-surface/60 px-3 py-3 text-xs text-muted">
                    {passkeyPrefetchError}
                  </div>
                ) : null}

                <div className="mt-auto space-y-3">
                  <button
                    disabled={Boolean(loading) || !passkeyPrefetchReady}
                    onClick={() =>
                      void beginPasskeyRegistration().catch((e) =>
                        setError(e instanceof Error ? e.message : String(e))
                      )
                    }
                    className="h-12 w-full rounded-full bg-primary text-base font-extrabold text-black shadow-soft disabled:opacity-50"
                  >
                    {!passkeyPrefetchReady
                      ? 'Preparing…'
                      : loading
                        ? loading
                        : 'Create Passkey'}
                  </button>
                  <button
                    onClick={() => {
                      setLoading(null)
                      setRoute('chooseSigner')
                    }}
                    className="h-12 w-full rounded-full border border-border bg-surface text-base font-bold text-fg shadow-soft"
                  >
                    Go Back
                  </button>
                </div>
              </div>
            ) : null}

            {!loading && route === 'passkeyCreated' ? (
              <div
                className={[
                  'mt-4 flex flex-col items-center animate-screenIn',
                  flowHeightClass,
                ].join(' ')}
              >
                <img src={logoUrl} alt="Latch" className="mt-3 h-10 w-10 object-contain" />

                <div className="mt-12 grid place-items-center">
                  <img
                    src={successAvatarUrl}
                    alt=""
                    className="h-44 w-44 object-contain animate-pop"
                  />
                </div>

                <h2 className="mt-8 text-center text-3xl font-extrabold tracking-tight">
                  Passkey Created!
                </h2>
                <p className="mt-3 text-center text-sm text-muted">Your account has been set up.</p>

                <div className="mt-auto w-full">
                  <button
                    onClick={() => setRoute('home')}
                    className="h-12 w-full rounded-full bg-primary text-base font-extrabold text-black shadow-soft"
                  >
                    Go to Dashboard
                  </button>
                </div>
              </div>
            ) : null}

            {!loading && (route === 'importSeed' || route === 'importSeedEncrypt') ? (
              <div className={['mt-4 flex min-h-0 flex-1 flex-col animate-screenIn', flowHeightClass].join(' ')}>
                <ImportSeedScreen
                  surface={surface}
                  step={route === 'importSeedEncrypt' ? 'encrypt' : importSeedStep}
                  words={seedWords.words}
                  onWordChange={seedWords.setWordAt}
                  onPasteWords={seedWords.fillFromPaste}
                  isValidPhrase={seedWords.isValid}
                  onBack={() => {
                    if (route === 'importSeedEncrypt') {
                      setRoute('importSeed')
                      setImportSeedStep('phrase')
                    } else {
                      setRoute('welcome')
                    }
                  }}
                  onProceedToEncrypt={() => {
                    setPendingMnemonic(seedWords.mnemonic)
                    setImportSeedStep('encrypt')
                    setRoute('importSeedEncrypt')
                  }}
                  encryptionPassword={seedEncryptionPassword}
                  encryptionConfirm={seedEncryptionConfirm}
                  onEncryptionPasswordChange={setSeedEncryptionPassword}
                  onEncryptionConfirmChange={setSeedEncryptionConfirm}
                  onImport={() =>
                    void beginMnemonicImport().catch((e) =>
                      setError(e instanceof Error ? e.message : String(e)),
                    )
                  }
                  onEncryptBack={() => {
                    setRoute('importSeed')
                    setImportSeedStep('phrase')
                  }}
                  importError={error}
                  busy={loading != null}
                />
              </div>
            ) : null}

            {!loading && route === 'unlockMnemonic' ? (
              <div className={['mt-4 flex flex-col animate-screenIn', flowHeightClass].join(' ')}>
                <div className="text-center">
                  <img src={logoUrl} alt="Latch" className="mx-auto h-10 w-10 object-contain" />
                  <h2 className="mt-4 text-2xl font-extrabold tracking-tight">Unlock saved phrase</h2>
                  <p className="mt-2 text-xs text-muted">Enter the password you chose when enabling Remember.</p>
                </div>
                <input
                  type="password"
                  value={unlockVaultPassword}
                  onChange={(e) => setUnlockVaultPassword(e.target.value)}
                  autoComplete="current-password"
                  className="mt-6 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-fg shadow-inner outline-none focus:border-primary"
                />
                <div className="mt-auto space-y-3 pt-6">
                  <button
                    type="button"
                    onClick={() =>
                      void unlockMnemonicVault().catch((e) =>
                        setError(e instanceof Error ? e.message : String(e))
                      )
                    }
                    className="h-12 w-full rounded-full bg-primary text-base font-extrabold text-black shadow-soft"
                  >
                    Unlock
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const dest = unlockReturnRoute === 'migration' ? 'migration' : 'home'
                      setUnlockReturnRoute(null)
                      setRoute(dest)
                    }}
                    className="h-12 w-full rounded-full border border-border bg-surface text-base font-bold text-fg shadow-soft"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : null}

            {!loading && route === 'home' ? (
              <div className={['mt-4 flex flex-col animate-screenIn', flowHeightClass].join(' ')}>
                {activeAccount?.mode === 'mnemonic' &&
                activeAccountHasMnemonicVault &&
                !activeAccountMnemonicSignerLoaded ? (
                  <div className="mb-3 rounded-2xl border border-primary/40 bg-surface/80 px-3 py-3 text-xs shadow-soft">
                    <div className="font-extrabold text-fg">Saved recovery phrase is locked</div>
                    <div className="mt-1 text-muted">Unlock to sign transactions after the extension restarts.</div>
                    <button
                      type="button"
                      onClick={() => {
                        setUnlockReturnRoute('home')
                        setRoute('unlockMnemonic')
                      }}
                      className="mt-2 h-9 w-full rounded-full bg-primary text-sm font-extrabold text-black"
                    >
                      Unlock
                    </button>
                  </div>
                ) : null}
                <HomeScreen
                  accountName={activeAccountLabel}
                  onOpenHistory={() => setRoute('history')}
                  onOpenMigrateAssets={
                    migrationDiscovery?.state === 'not_started'
                      ? () => setRoute('migration')
                      : undefined
                  }
                  portfolioTokens={homePortfolioTokens}
                  portfolioLoading={portfolioLoading}
                  portfolioError={portfolioError}
                  totalBalanceUsd={totalBalanceUsd}
                  onOpenSwap={() => {
                    setSwapDraft({
                      payTokenId: 'usdt',
                      receiveTokenId: 'xlm',
                      payAmount: '',
                      useExchangeBalance: false,
                      approved: false,
                    })
                    setSwapQuote(null)
                    setRoute('swap')
                  }}
                  onOpenSend={openSendFlow}
                />
              </div>
            ) : null}

            {!loading && route === 'migration' && activeAccount?.id ? (
              <div className={['mt-4 flex min-h-0 flex-1 flex-col animate-screenIn', flowHeightClass].join(' ')}>
                <MigrationScreen
                  surface={surface}
                  accountId={activeAccount.id}
                  onBack={() => setRoute('home')}
                  onDone={() => setRoute('migrationSuccess')}
                  onNeedUnlock={() => {
                    setUnlockReturnRoute('migration')
                    setRoute('unlockMnemonic')
                  }}
                />
              </div>
            ) : null}

            {!loading && route === 'migrationSuccess' ? (
              <div
                className={['mt-4 flex min-h-0 flex-1 flex-col items-center animate-screenIn', flowHeightClass].join(
                  ' ',
                )}
              >
                <img src={successAvatarUrl} alt="" className="h-16 w-16 object-contain" />
                <h2 className="mt-6 text-center text-2xl font-extrabold tracking-tight">Migration complete</h2>
                <p className="mt-3 max-w-[280px] text-center text-sm leading-relaxed text-muted">
                  Your transactions were submitted to the network. Balances may take a moment to update on-chain.
                </p>
                <button
                  type="button"
                  className="mt-8 h-12 w-full max-w-xs rounded-full bg-primary text-base font-extrabold text-black shadow-soft"
                  onClick={() => {
                    setMigrationDiscovery(undefined)
                    void loadPortfolio()
                    setRoute('home')
                  }}
                >
                  Back to home
                </button>
              </div>
            ) : null}

            {!loading && route === 'history' ? (
              <div className={['mt-4 flex min-h-0 flex-1 flex-col animate-screenIn', flowHeightClass].join(' ')}>
                <HistoryScreen
                  surface={surface}
                  sections={historySections}
                  loading={historyLoading}
                  error={historyError}
                  onBack={() => setRoute('home')}
                  onRefresh={() => void loadHistory()}
                  onSelectItem={(it) => {
                    const c = activeAccount?.smartAccountAddress ?? ''
                    setTransactionDetail(buildTransactionDetail(it, c, networkLabel))
                    setRoute('transactionDetail')
                  }}
                />
              </div>
            ) : null}

            {!loading && route === 'transactionDetail' && transactionDetail ? (
              <div className={['mt-4 flex min-h-0 flex-1 flex-col animate-screenIn', flowHeightClass].join(' ')}>
                <TransactionDetailScreen
                  surface={surface}
                  detail={transactionDetail}
                  onBack={() => setRoute('history')}
                />
              </div>
            ) : null}

            {!loading && route === 'swap' ? (
              <div className={['mt-4 flex flex-col animate-screenIn', flowHeightClass].join(' ')}>
                <SwapScreen
                  surface={surface}
                  initialState={swapDraft ?? undefined}
                  swapTokenCatalog={swapTokenCatalog}
                  onBack={() => setRoute('home')}
                  onContinue={(q, d) => {
                    setSwapDraft(d)
                    setSwapQuote(q)
                    setRoute('swapConfirm')
                  }}
                />
              </div>
            ) : null}

            {!loading && route === 'swapConfirm' ? (
              <div className={['mt-4 flex flex-col animate-screenIn', flowHeightClass].join(' ')}>
                {swapDraft && swapQuote ? (
                  <ConfirmSwapScreen
                    surface={surface}
                    draft={swapDraft}
                    quote={swapQuote}
                    onBackOrCancel={() => setRoute('swap')}
                    onConfirm={() => {
                      setSwapDraft(null)
                      setSwapQuote(null)
                      setRoute('home')
                    }}
                  />
                ) : (
                  <div className="rounded-2xl border border-border bg-surface/60 p-4 text-sm shadow-soft">
                    <div className="font-extrabold">Swap session expired</div>
                    <div className="mt-2 text-muted">Start a new swap from the dashboard.</div>
                    <button
                      className="mt-4 h-10 w-full rounded-full bg-primary text-sm font-extrabold text-black"
                      onClick={() => setRoute('home')}
                    >
                      Back to Home
                    </button>
                  </div>
                )}
              </div>
            ) : null}

            {!loading && route === 'send' ? (
              <div className={['mt-4 flex min-h-0 flex-1 flex-col animate-screenIn', flowHeightClass].join(' ')}>
                <SendFlow
                  surface={surface}
                  step={sendStep}
                  draft={sendDraft}
                  result={sendResult}
                  portfolioRows={portfolioRows}
                  portfolioLoading={portfolioLoading}
                  portfolioError={portfolioError}
                  networkLabel={networkLabel}
                  sendProgressLabel={sendProgressLabel}
                  sendError={sendError}
                  onDraftChange={(patch) => setSendDraft((d) => ({ ...d, ...patch }))}
                  onStepChange={setSendStep}
                  onBackFromSend={() => {
                    resetSendFlow()
                    setRoute('home')
                  }}
                  onFetchFeeEstimate={fetchSendFeeEstimate}
                  onSubmitSend={() => void handleSubmitSend()}
                  onContinueHome={() => {
                    resetSendFlow()
                    setRoute('home')
                  }}
                  onTryAgainFromFailure={() => {
                    setSendError(sendResult?.errorMessage ?? null)
                    setSendStep('summary')
                  }}
                />
              </div>
            ) : null}

          </>
        ) : null}

        {renameAccountId ? (
          <div
            className="absolute inset-0 z-[100] flex justify-center bg-black/45 px-4 pt-[72px]"
            role="presentation"
            onClick={() => setRenameAccountId(null)}
          >
            <div
              className="h-fit w-full max-w-[300px] rounded-2xl border border-border bg-surface/95 p-4 shadow-soft"
              role="dialog"
              aria-labelledby="rename-account-title"
              onClick={(e) => e.stopPropagation()}
            >
              <div id="rename-account-title" className="text-sm font-extrabold">
                Rename account
              </div>
              <input
                value={renameDraft}
                onChange={(e) => setRenameDraft(e.target.value)}
                className="mt-3 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-fg shadow-inner outline-none focus:border-primary"
                maxLength={32}
                autoFocus
              />
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setRenameAccountId(null)}
                  className="h-10 flex-1 rounded-full border border-border bg-bg text-sm font-extrabold text-fg hover:bg-surface/60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!renameAccountId) return
                    void sendToBackground<{ accountId: string; label?: string }, undefined>({
                      type: 'RENAME_ACCOUNT',
                      payload: { accountId: renameAccountId, label: renameDraft.trim() || undefined },
                    })
                      .then(() => refreshAccounts())
                      .then(() => setRenameAccountId(null))
                      .catch(() => {})
                  }}
                  className="h-10 flex-1 rounded-full bg-primary text-sm font-extrabold text-black shadow-soft"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
