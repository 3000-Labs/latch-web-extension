import '../style.css'

import React, { useEffect, useMemo, useState } from 'react'

import type {
  BackgroundMessage,
  BackgroundResponse,
  BuildDelegatedTxResponse,
  BuildTxResponse,
  CreateOrConnectFreighterRequest,
  CreateOrConnectFreighterResponse,
  CreateOrConnectPasskeyRequest,
  CreateOrConnectPasskeyResponse,
  CreateOrConnectPhantomRequest,
  CreateOrConnectPhantomResponse,
  GetAccountsResponse,
  GetSetupStateResponse,
  ImportMnemonicAccountRequest,
  ImportMnemonicAccountResponse,
  ListPendingDappRequestsResponse,
  PendingDappRequest,
  SerializableError,
  SetSetupStateRequest,
  SetActiveAccountRequest,
  SignDelegatedGAuthEntryRequest,
  SignDelegatedGAuthEntryResponse,
  StoredAccount,
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
import { startAuthentication, startRegistration } from '@simplewebauthn/browser'
import bs58 from 'bs58'
import { ExternalLink, Menu } from 'lucide-react'

import logoUrl from 'url:../../assets/brand/latch-logo.svg'
import biometricsUrl from 'url:../../assets/icons/biometrics.svg'
import successAvatarUrl from 'url:../../assets/avatars/success.png'

import { SectionCard } from './components/SectionCard'
import { HomeScreen } from './screens/HomeScreen'
import { HistoryScreen } from './screens/HistoryScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { SwapScreen } from './screens/SwapScreen'
import { ConfirmSwapScreen } from './screens/ConfirmSwapScreen'
import { AccountMenu } from './components/AccountMenu'

import {
  buildWebauthnSigDataXdrHex,
  createLocalAuthenticationOptions,
  createLocalRegistrationOptions,
  extractRegistrationKeyData,
  parseAuthenticationResponse,
} from './webauthn/passkey'
import { bytesToHex } from './webauthn/utils'
import type { SwapDraft, SwapQuoteVm } from './swap/swapVm'

type Theme = 'dark' | 'light'
type Surface = 'popup' | 'sidepanel'
type UiSurfacePreference = 'popup' | 'sidepanel'
type Page = 'main' | 'settings'

type Route =
  | 'welcome'
  | 'chooseSigner'
  | 'createPasskey'
  | 'passkeyCreated'
  | 'importSeed'
  | 'unlockMnemonic'
  | 'home'
  | 'history'
  | 'swap'
  | 'swapConfirm'
  | 'sendTx'
  | 'txResult'
  | 'dappApproval'

type SignerId = 'freighter' | 'phantom' | 'passkey'

const STORAGE_KEYS = {
  theme: 'latch.theme',
  uiSurface: 'latch.uiSurface',
} as const

async function sendToBackground<TPayload, TData>(
  message: BackgroundMessage<TPayload>
): Promise<BackgroundResponse<TData>> {
  return (await chrome.runtime.sendMessage(message)) as BackgroundResponse<TData>
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
  const { theme, setTheme } = useTheme()
  const { pref, setPref } = useUiSurfacePreference()

  // Product direction: ship passkey-only for now, but keep other signer integrations ready to re-enable.
  const ENABLE_OTHER_SIGNERS = false

  const [route, setRoute] = useState<Route>('welcome')
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

  const [builtTx, setBuiltTx] = useState<BuildTxResponse | null>(null)
  const [builtDelegatedTx, setBuiltDelegatedTx] = useState<BuildDelegatedTxResponse | null>(null)
  const [txResult, setTxResult] = useState<SubmitTxResponse | null>(null)

  const [swapDraft, setSwapDraft] = useState<SwapDraft | null>(null)
  const [swapQuote, setSwapQuote] = useState<SwapQuoteVm | null>(null)

  const [activeAccountHasMnemonicVault, setActiveAccountHasMnemonicVault] = useState(false)
  const [seedPhraseText, setSeedPhraseText] = useState('')
  const [seedPhraseVisible, setSeedPhraseVisible] = useState(false)
  const [seedExtensionPassphrase, setSeedExtensionPassphrase] = useState('')
  const [rememberSeed, setRememberSeed] = useState(false)
  const [seedEncryptionPassword, setSeedEncryptionPassword] = useState('')
  const [unlockVaultPassword, setUnlockVaultPassword] = useState('')

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

  async function refreshAccounts() {
    const res = await sendToBackground<undefined, GetAccountsResponse>({
      type: 'GET_ACCOUNTS',
      payload: undefined,
    })
    if (!res.ok || !res.data) return
    setAccounts(res.data.accounts)
    setActiveAccountId(res.data.activeAccountId)
    setActiveAccountHasMnemonicVault(Boolean(res.data.activeAccountHasMnemonicVault))
  }

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
      const gAddress =
        typeof g === 'string' ? g : typeof (g as any)?.address === 'string' ? (g as any).address : undefined
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
      const provider: any = (window as any).phantom?.solana
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
        mnemonic: seedPhraseText,
        bip39Passphrase: seedExtensionPassphrase || undefined,
        remember: rememberSeed,
        encryptionPassword: rememberSeed ? seedEncryptionPassword : undefined,
      }
      const res = await sendToBackground<ImportMnemonicAccountRequest, ImportMnemonicAccountResponse>({
        type: 'IMPORT_MNEMONIC_ACCOUNT',
        payload: req,
      })
      if (!res.ok) throw new Error(friendlyError(res.error))
      await persistSetupHasAccount(res.data!.smartAccountAddress)
      await refreshAccounts()
      setSeedPhraseText('')
      setSeedExtensionPassphrase('')
      setSeedEncryptionPassword('')
      setRememberSeed(false)
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
      setRoute('home')
    } finally {
      setLoading(null)
    }
  }

  async function beginPasskeyRegistration() {
    setError(null)
    setLoading('Creating passkey…')
    try {
      const rpId = window.location.hostname
      const options = createLocalRegistrationOptions(rpId)
      const reg = await startRegistration(options as any)
      const extracted = extractRegistrationKeyData(reg)

      const res = await sendToBackground<
        CreateOrConnectPasskeyRequest,
        CreateOrConnectPasskeyResponse & { account: StoredAccount }
      >({
        type: 'CREATE_OR_CONNECT_PASSKEY',
        payload: { keyDataHex: extracted.keyDataHex, credentialId: extracted.credentialId },
      })
      if (!res.ok) throw new Error(friendlyError(res.error))
      await persistSetupHasAccount(res.data!.smartAccountAddress)
      await refreshAccounts()
      setRoute('passkeyCreated')
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
      return
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
  }

  async function signAndSubmit(): Promise<string> {
    if (!activeAccount) throw new Error('No active account')
    setError(null)
    setLoading('Building transaction…')
    try {
      await buildForActiveAccount()

      if (activeAccount.mode === 'freighter') {
        const b =
          builtDelegatedTx ??
          (
            await sendToBackground<any, BuildDelegatedTxResponse>({
              type: 'BUILD_DELEGATED_TX',
              payload: {
                smartAccountAddress: activeAccount.smartAccountAddress,
                gAddress: activeAccount.gAddress,
              },
            })
          ).data
        if (!b) throw new Error('Failed to build delegated transaction.')
        setLoading('Awaiting Freighter signature…')
        const signed = await signAuthEntry(b.gAddressPreimageXdr as any)
        const signedAuthEntryBase64 = (signed as any)?.signedAuthEntry as string | undefined
        const signerAddress = signed?.signerAddress
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
        setTxResult(submitRes.data ?? {})
        setRoute('txResult')
        return b.txXdr
      }

      if (activeAccount.mode === 'mnemonic') {
        if (!activeAccount.gAddress) throw new Error('Missing G-address for mnemonic account')
        const b =
          builtDelegatedTx ??
          (
            await sendToBackground<any, BuildDelegatedTxResponse>({
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
        setTxResult(submitRes.data ?? {})
        setRoute('txResult')
        return b.txXdr
      }

      if (activeAccount.mode === 'phantom') {
        const provider: any = (window as any).phantom?.solana
        if (!provider) throw new Error('Phantom not detected.')
        const b =
          builtTx ??
          (
            await sendToBackground<any, BuildTxResponse>({
              type: 'BUILD_TX',
              payload: {
                smartAccountAddress: activeAccount.smartAccountAddress,
                signerG: activeAccount.gAddress,
              },
            })
          ).data
        if (!b) throw new Error('Failed to build transaction.')

        const prefixedMessage = `Stellar Smart Account Auth:\n${b.authDigestHex}`
        const msgBytes = new TextEncoder().encode(prefixedMessage)
        setLoading('Awaiting Phantom signature…')
        const signed = await provider.signMessage(msgBytes)
        const sigBytes: Uint8Array = signed?.signature ?? signed
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
          },
        })
        if (!submitRes.ok) throw new Error(friendlyError(submitRes.error))
        setTxResult(submitRes.data ?? {})
        setRoute('txResult')
        return b.txXdr
      }

      // passkey
      const b =
        builtTx ??
        (
          await sendToBackground<any, BuildTxResponse>({
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

      setLoading('Awaiting passkey authentication…')
      const rpId = window.location.hostname
      const authOpts = createLocalAuthenticationOptions({
        rpId,
        credentialId: activeAccount.passkeyCredentialId,
        authDigestHex: b.authDigestHex,
      })
      const assertion = await startAuthentication(authOpts as any)
      const parsed = parseAuthenticationResponse(assertion)
      const sigDataXdr = buildWebauthnSigDataXdrHex({
        authenticatorData: parsed.authenticatorData,
        clientDataJson: parsed.clientDataJson,
        signatureCompact: parsed.signatureCompact,
      })

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
      if (!submitRes.ok) throw new Error(friendlyError(submitRes.error))
      setTxResult(submitRes.data ?? {})
      setRoute('txResult')
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
      setAccounts([])
      setActiveAccountId(undefined)
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
          {page === 'main' && route === 'home' ? (
            <AccountMenu
              name="Crownz"
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
              accountName={activeAccount?.smartAccountAddress ? 'Crownz' : 'Account'}
              accountAddress={activeAccount?.smartAccountAddress ?? '—'}
              theme={theme}
              onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              biometricsEnabled={false}
              onChangeBiometricsEnabled={() => {}}
              sidepanelPreferenceSection={sidepanelPreferenceSection}
              onClose={() => setPage('main')}
              onLogout={() => void logout().catch((e) => setError(e instanceof Error ? e.message : String(e)))}
            />
          </div>
        ) : null}

        {page === 'main' ? (
          <>
            {loading ? (
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

            {!loading && error ? (
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
                  <button
                    onClick={() => setRoute('chooseSigner')}
                    className="h-12 w-full rounded-full bg-primary text-base font-extrabold text-black shadow-soft"
                  >
                    Create a New Wallet
                  </button>
                  <button
                    onClick={() => setRoute('chooseSigner')}
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

            {!loading && route === 'chooseSigner' ? (
              <div className={['mt-4 flex flex-col animate-screenIn', flowHeightClass].join(' ')}>
                <div className="text-center">
                  <img src={logoUrl} alt="Latch" className="mx-auto h-10 w-10 object-contain" />
                  <h2 className="mt-4 text-3xl font-extrabold tracking-tight">Choose Signer</h2>
                  <p className="mt-2 text-sm text-muted">
                    Select a signer to secure your smart account
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
                        onClick={() => setRoute('createPasskey')}
                        className="h-12 w-full rounded-full bg-primary text-base font-extrabold text-black shadow-soft"
                      >
                        Continue with Passkey
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
                      onClick={() => setRoute('welcome')}
                      className="h-12 w-full rounded-full border border-border bg-surface text-base font-bold text-fg shadow-soft"
                    >
                      Go Back
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            {!loading && route === 'createPasskey' ? (
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

                <div className="mt-auto space-y-3">
                  <button
                    onClick={() =>
                      void beginPasskeyRegistration().catch((e) =>
                        setError(e instanceof Error ? e.message : String(e))
                      )
                    }
                    className="h-12 w-full rounded-full bg-primary text-base font-extrabold text-black shadow-soft"
                  >
                    Create Passkey
                  </button>
                  <button
                    onClick={() => setRoute('chooseSigner')}
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

            {!loading && route === 'importSeed' ? (
              <div className={['mt-4 flex flex-col animate-screenIn', flowHeightClass].join(' ')}>
                <div className="text-center">
                  <img src={logoUrl} alt="Latch" className="mx-auto h-10 w-10 object-contain" />
                  <h2 className="mt-4 text-2xl font-extrabold tracking-tight">Import recovery phrase</h2>
                  <p className="mt-2 text-xs text-muted">
                    Your phrase stays on this device. Only your public Stellar address is sent to Latch.
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <label className="block text-xs font-bold text-muted">Recovery phrase (12–24 words)</label>
                  <button
                    type="button"
                    onClick={() => setSeedPhraseVisible((v) => !v)}
                    className="rounded-full px-3 py-1 text-xs font-extrabold text-fg/80 hover:bg-surface/60 hover:text-fg"
                    aria-pressed={seedPhraseVisible}
                  >
                    {seedPhraseVisible ? 'Hide' : 'View'}
                  </button>
                </div>
                <textarea
                  value={seedPhraseText}
                  onChange={(e) => setSeedPhraseText(e.target.value)}
                  rows={4}
                  autoComplete="off"
                  style={
                    ({
                      WebkitTextSecurity: seedPhraseVisible ? 'none' : 'disc',
                    }) as React.CSSProperties
                  }
                  className="mt-1 w-full resize-none rounded-xl border border-border bg-surface px-3 py-2 text-sm text-fg shadow-inner outline-none focus:border-primary"
                  placeholder="word1 word2 …"
                />

                <label className="mt-3 block text-xs font-bold text-muted">BIP-39 passphrase (optional)</label>
                <input
                  type="password"
                  value={seedExtensionPassphrase}
                  onChange={(e) => setSeedExtensionPassphrase(e.target.value)}
                  autoComplete="new-password"
                  className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-fg shadow-inner outline-none focus:border-primary"
                />

                <label className="mt-3 flex items-center gap-2 text-sm font-bold">
                  <input
                    type="checkbox"
                    checked={rememberSeed}
                    onChange={(e) => setRememberSeed(e.target.checked)}
                  />
                  Remember on this device (encrypted)
                </label>
                {rememberSeed ? (
                  <>
                    <label className="mt-2 block text-xs font-bold text-muted">Encryption password</label>
                    <input
                      type="password"
                      value={seedEncryptionPassword}
                      onChange={(e) => setSeedEncryptionPassword(e.target.value)}
                      autoComplete="new-password"
                      className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-fg shadow-inner outline-none focus:border-primary"
                    />
                  </>
                ) : null}

                <div className="mt-auto space-y-3 pt-4">
                  <button
                    type="button"
                    onClick={() =>
                      void beginMnemonicImport().catch((e) =>
                        setError(e instanceof Error ? e.message : String(e))
                      )
                    }
                    className="h-12 w-full rounded-full bg-primary text-base font-extrabold text-black shadow-soft"
                  >
                    Import & connect
                  </button>
                  <button
                    type="button"
                    onClick={() => setRoute('welcome')}
                    className="h-12 w-full rounded-full border border-border bg-surface text-base font-bold text-fg shadow-soft"
                  >
                    Go Back
                  </button>
                </div>
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
                    onClick={() => setRoute('home')}
                    className="h-12 w-full rounded-full border border-border bg-surface text-base font-bold text-fg shadow-soft"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : null}

            {!loading && route === 'home' ? (
              <div className={['mt-4 flex flex-col animate-screenIn', flowHeightClass].join(' ')}>
                {activeAccount?.mode === 'mnemonic' && activeAccountHasMnemonicVault ? (
                  <div className="mb-3 rounded-2xl border border-primary/40 bg-surface/80 px-3 py-3 text-xs shadow-soft">
                    <div className="font-extrabold text-fg">Saved recovery phrase is locked</div>
                    <div className="mt-1 text-muted">Unlock to sign transactions after the extension restarts.</div>
                    <button
                      type="button"
                      onClick={() => setRoute('unlockMnemonic')}
                      className="mt-2 h-9 w-full rounded-full bg-primary text-sm font-extrabold text-black"
                    >
                      Unlock
                    </button>
                  </div>
                ) : null}
                <HomeScreen
                  accountName="Crownz"
                  onOpenHistory={() => setRoute('history')}
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
                />
              </div>
            ) : null}

            {!loading && route === 'history' ? (
              <div className={['mt-4 flex flex-col animate-screenIn', flowHeightClass].join(' ')}>
                <HistoryScreen
                  onBack={() => setRoute('home')}
                  onSelectItem={(it) => {
                    if (it.kind !== 'swap') return
                    setSwapDraft({
                      payTokenId: it.asset.includes('XLM') ? 'xlm' : 'usdt',
                      receiveTokenId: it.asset.includes('XLM') ? 'usdt' : 'xlm',
                      payAmount: '1',
                      useExchangeBalance: false,
                      approved: true,
                    })
                    setSwapQuote(null)
                    setRoute('swap')
                  }}
                />
              </div>
            ) : null}

            {!loading && route === 'swap' ? (
              <div className={['mt-4 flex flex-col animate-screenIn', flowHeightClass].join(' ')}>
                <SwapScreen
                  surface={surface}
                  initialState={swapDraft ?? undefined}
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

            {!loading && route === 'sendTx' ? (
              <div className={['mt-4 flex flex-col animate-screenIn', flowHeightClass].join(' ')}>
                <div className="text-center">
                  <img src={logoUrl} alt="Latch" className="mx-auto h-10 w-10 object-contain" />
                  <h2 className="mt-4 text-3xl font-extrabold tracking-tight">Send</h2>
                  <p className="mt-2 text-sm text-muted">Build → sign → submit</p>
                </div>

                <div className="mt-6 rounded-2xl border border-border bg-surface/60 p-4 text-sm shadow-soft">
                  <div className="font-extrabold">Active account</div>
                  <div className="mt-2 text-muted">{activeAccount?.smartAccountAddress ?? '—'}</div>
                </div>

                <div className="mt-auto space-y-3">
                  <button
                    onClick={() =>
                      void signAndSubmit().catch((e) =>
                        setError(e instanceof Error ? e.message : String(e))
                      )
                    }
                    className="h-12 w-full rounded-full bg-primary text-base font-extrabold text-black shadow-soft"
                  >
                    Build & Sign
                  </button>
                  <button
                    onClick={() => setRoute('home')}
                    className="h-12 w-full rounded-full border border-border bg-surface text-base font-bold text-fg shadow-soft"
                  >
                    Back
                  </button>
                </div>
              </div>
            ) : null}

            {!loading && route === 'txResult' ? (
              <div className={['mt-4 flex flex-col animate-screenIn', flowHeightClass].join(' ')}>
                <div className="text-center">
                  <img src={logoUrl} alt="Latch" className="mx-auto h-10 w-10 object-contain" />
                  <h2 className="mt-4 text-3xl font-extrabold tracking-tight">Submitted</h2>
                  <p className="mt-2 text-sm text-muted">Transaction submission response</p>
                </div>

                <div className="mt-6 rounded-2xl border border-border bg-surface/60 p-4 text-xs shadow-soft">
                  <pre className="whitespace-pre-wrap break-all text-fg/90">
                    {JSON.stringify(txResult ?? {}, null, 2)}
                  </pre>
                </div>

                <div className="mt-auto space-y-3">
                  <button
                    onClick={() => {
                      setBuiltTx(null)
                      setBuiltDelegatedTx(null)
                      setTxResult(null)
                      setRoute('home')
                    }}
                    className="h-12 w-full rounded-full bg-primary text-base font-extrabold text-black shadow-soft"
                  >
                    Back to Home
                  </button>
                </div>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  )
}
