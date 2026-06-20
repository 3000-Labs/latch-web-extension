import { useCallback, useEffect, useRef, useState } from 'react'
import { startAuthentication } from '@simplewebauthn/browser'

import type {
  BackendWebauthnAuthenticationFinishResponse,
  BackendWebauthnBeginResponse,
  ImportMnemonicAccountRequest,
  ImportMnemonicAccountResponse,
  SetActiveAccountRequest,
  StoredAccount,
} from '@latch/types'

import { friendlyError, sendToBackground } from '../../../lib/backgroundClient'
import { useSeedPhraseWords } from '../../import-seed/useSeedPhraseWords'
import {
  assertBeginOptionsRpIdMatchesExtension,
  enrichWebauthnRpIdHashErrorMessage,
  formatWebauthnBrowserError,
} from '../../../webauthn/passkey'
import { openPasskeyBridgeAndWait } from '../../../webauthn/passkeyBridge'
import {
  AddAccountChooseMethodScreen,
  type AddAccountMethod,
} from './AddAccountChooseMethodScreen'
import { AddAccountCreateScreen } from './AddAccountCreateScreen'
import { AddAccountPasskeyScreen } from './AddAccountPasskeyScreen'
import { AddAccountRecoveryPhraseScreen } from './AddAccountRecoveryPhraseScreen'
import { AddAccountSuccessScreen } from './AddAccountSuccessScreen'

type AddAccountStep =
  | 'chooseMethod'
  | 'passkey'
  | 'recoveryPhrase'
  | 'createAccount'
  | 'success'

type PendingPasskey = {
  optionsJSON: unknown
  assertion: unknown
}

type PendingRecovery = {
  mnemonic: string
}

const CREATE_MIN_MS = 1200

export function AddAccountFlow({
  surface,
  onBack,
  onComplete,
  onAccountsChanged,
}: {
  surface: 'popup' | 'sidepanel'
  onBack: () => void
  onComplete: () => void
  onAccountsChanged: () => void
}) {
  const [step, setStep] = useState<AddAccountStep>('chooseMethod')
  const [selectedMethod, setSelectedMethod] = useState<AddAccountMethod | null>(null)
  const [accountName, setAccountName] = useState('Trading')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const [passkeyPrefetchReady, setPasskeyPrefetchReady] = useState(false)
  const [passkeyPrefetchError, setPasskeyPrefetchError] = useState<string | null>(null)
  const [passkeyActionError, setPasskeyActionError] = useState<string | null>(null)
  const [passkeyBusy, setPasskeyBusy] = useState(false)
  const passkeyOptionsRef = useRef<unknown>(null)
  const [passkeyPrefetchNonce, setPasskeyPrefetchNonce] = useState(0)

  const pendingPasskeyRef = useRef<PendingPasskey | null>(null)
  const pendingRecoveryRef = useRef<PendingRecovery | null>(null)

  const seedWords = useSeedPhraseWords()

  useEffect(() => {
    if (step !== 'passkey') {
      passkeyOptionsRef.current = null
      setPasskeyPrefetchReady(false)
      setPasskeyPrefetchError(null)
      setPasskeyActionError(null)
      setPasskeyBusy(false)
      return
    }

    let cancelled = false
    setPasskeyPrefetchReady(false)
    setPasskeyPrefetchError(null)
    passkeyOptionsRef.current = null

    void (async () => {
      try {
        const begin = await sendToBackground<undefined, BackendWebauthnBeginResponse>({
          type: 'PASSKEY_AUTH_BEGIN',
          payload: undefined,
        })
        if (cancelled) return
        if (!begin.ok) throw new Error(friendlyError(begin.error))

        const optionsJSON = begin.data?.options
        assertBeginOptionsRpIdMatchesExtension(optionsJSON)
        passkeyOptionsRef.current = optionsJSON
        if (!cancelled) setPasskeyPrefetchReady(true)
      } catch (e) {
        if (!cancelled) {
          setPasskeyPrefetchError(e instanceof Error ? e.message : String(e))
          passkeyOptionsRef.current = null
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [step, passkeyPrefetchNonce])

  const runPasskeyAuthentication = useCallback(async () => {
    const optionsJSON = passkeyOptionsRef.current
    if (!optionsJSON) {
      throw new Error(
        passkeyPrefetchError ??
          (passkeyPrefetchReady
            ? 'Passkey session is stale. Go back and try again.'
            : 'Still preparing passkey…')
      )
    }

    assertBeginOptionsRpIdMatchesExtension(optionsJSON)

    if (surface === 'sidepanel') {
      return await openPasskeyBridgeAndWait({ mode: 'authentication', optionsJSON })
    }

    try {
      return await startAuthentication({
        optionsJSON,
      } as Parameters<typeof startAuthentication>[0])
    } catch (e) {
      throw new Error(formatWebauthnBrowserError(e))
    }
  }, [passkeyPrefetchError, passkeyPrefetchReady, surface])

  const handleAuthenticatePasskey = useCallback(() => {
    setPasskeyActionError(null)
    setPasskeyBusy(true)
    void (async () => {
      try {
        const optionsJSON = passkeyOptionsRef.current
        const assertion = await runPasskeyAuthentication()
        pendingPasskeyRef.current = { optionsJSON, assertion }
        pendingRecoveryRef.current = null
        setStep('createAccount')
      } catch (e) {
        setPasskeyPrefetchNonce((n) => n + 1)
        setPasskeyActionError(e instanceof Error ? e.message : String(e))
      } finally {
        setPasskeyBusy(false)
      }
    })()
  }, [runPasskeyAuthentication])

  const handleImportRecoveryPhrase = useCallback(() => {
    if (!seedWords.isValid) return
    pendingRecoveryRef.current = { mnemonic: seedWords.mnemonic }
    pendingPasskeyRef.current = null
    setStep('createAccount')
  }, [seedWords.isValid, seedWords.mnemonic])

  const finishCreateAccount = useCallback(async () => {
    const label = accountName.trim()
    if (!label) return

    setCreateError(null)
    setCreating(true)
    const started = Date.now()

    try {
      let account: StoredAccount | undefined

      if (pendingPasskeyRef.current) {
        const { assertion } = pendingPasskeyRef.current
        const res = await sendToBackground<
          { response: unknown },
          BackendWebauthnAuthenticationFinishResponse & { account: StoredAccount }
        >({
          type: 'PASSKEY_AUTH_FINISH',
          payload: { response: assertion },
        })
        if (!res.ok) {
          const errMsg = friendlyError(res.error)
          throw new Error(
            await enrichWebauthnRpIdHashErrorMessage(errMsg, {
              optionsJSON: pendingPasskeyRef.current.optionsJSON,
              credentialResponse: assertion,
            })
          )
        }
        account = res.data!.account
      } else if (pendingRecoveryRef.current) {
        const req: ImportMnemonicAccountRequest = {
          mnemonic: pendingRecoveryRef.current.mnemonic,
          remember: false,
        }
        const res = await sendToBackground<
          ImportMnemonicAccountRequest,
          ImportMnemonicAccountResponse
        >({
          type: 'IMPORT_MNEMONIC_ACCOUNT',
          payload: req,
        })
        if (!res.ok) throw new Error(friendlyError(res.error))
        account = res.data!.account
      } else {
        throw new Error('No signer data available. Go back and try again.')
      }

      if (account?.id) {
        await sendToBackground<{ accountId: string; label?: string }, undefined>({
          type: 'RENAME_ACCOUNT',
          payload: { accountId: account.id, label },
        })
        await sendToBackground<SetActiveAccountRequest, undefined>({
          type: 'SET_ACTIVE_ACCOUNT',
          payload: { accountId: account.id },
        })
      }

      const elapsed = Date.now() - started
      if (elapsed < CREATE_MIN_MS) {
        await new Promise((resolve) => setTimeout(resolve, CREATE_MIN_MS - elapsed))
      }

      onAccountsChanged()
      setStep('success')
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : String(e))
    } finally {
      setCreating(false)
    }
  }, [accountName, onAccountsChanged])

  const handleCreateBack = useCallback(() => {
    if (creating) return
    setCreateError(null)
    setStep(selectedMethod === 'recoveryPhrase' ? 'recoveryPhrase' : 'passkey')
  }, [creating, selectedMethod])

  const handleContinueFromChoose = useCallback(() => {
    if (selectedMethod === 'passkey') {
      setStep('passkey')
      return
    }
    if (selectedMethod === 'recoveryPhrase') {
      setStep('recoveryPhrase')
    }
  }, [selectedMethod])

  const handleBackFromChoose = useCallback(() => {
    onBack()
  }, [onBack])

  const handleBackFromPasskeyOrRecovery = useCallback(() => {
    setStep('chooseMethod')
    setSelectedMethod(null)
  }, [])

  if (step === 'success') {
    return (
      <AddAccountSuccessScreen
        accountName={accountName.trim()}
        onBack={onComplete}
        onViewAccounts={onComplete}
      />
    )
  }

  if (step === 'createAccount') {
    return (
      <AddAccountCreateScreen
        accountName={accountName}
        onAccountNameChange={setAccountName}
        creating={creating}
        createError={createError}
        onBack={handleCreateBack}
        onCreate={() => void finishCreateAccount()}
      />
    )
  }

  return (
    <div className="flex h-full w-full min-h-0 flex-col">
      {step === 'chooseMethod' ? (
        <AddAccountChooseMethodScreen
          selected={selectedMethod}
          onSelect={setSelectedMethod}
          onContinue={handleContinueFromChoose}
          onBack={handleBackFromChoose}
        />
      ) : null}

      {step === 'passkey' ? (
        <AddAccountPasskeyScreen
          prefetchReady={passkeyPrefetchReady}
          prefetchError={passkeyPrefetchError}
          actionError={passkeyActionError}
          busy={passkeyBusy}
          onAuthenticate={handleAuthenticatePasskey}
          onBack={handleBackFromPasskeyOrRecovery}
        />
      ) : null}

      {step === 'recoveryPhrase' ? (
        <AddAccountRecoveryPhraseScreen
          words={seedWords.words}
          onWordChange={seedWords.setWordAt}
          onPasteWords={seedWords.fillFromPaste}
          isValidPhrase={seedWords.isValid}
          onImportWallet={handleImportRecoveryPhrase}
          onBack={handleBackFromPasskeyOrRecovery}
        />
      ) : null}
    </div>
  )
}
