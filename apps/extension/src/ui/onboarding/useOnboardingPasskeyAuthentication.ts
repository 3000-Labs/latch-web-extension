import { useCallback, useEffect, useRef, useState } from 'react'
import { startAuthentication } from '@simplewebauthn/browser'

import type {
  BackendAccountsResponse,
  BackendSessionAccount,
  BackendWebauthnAuthenticationFinishResponse,
  BackendWebauthnBeginResponse,
  GetAccountsResponse,
  SetSetupStateRequest,
  StoredAccount,
} from '@latch/types'

import { friendlyError, sendToBackground } from '../lib/backgroundClient'
import {
  assertBeginOptionsRpIdMatchesExtension,
  enrichWebauthnRpIdHashErrorMessage,
  formatWebauthnBrowserError,
  narrowAuthenticationOptionsToCredential,
  prepareAuthenticationOptionsForGet,
  webauthnBeginOptionsToObject,
} from '../webauthn/passkey'

export type OnboardingPasskeyOption = {
  credentialId: string
  smartAccountAddress?: string
}

type PrefetchState = {
  kind: 'authentication'
  optionsJSON: unknown
}

function mergePasskeyOptions(
  accounts: BackendSessionAccount[],
  optionsJSON: unknown
): OnboardingPasskeyOption[] {
  const seen = new Set<string>()
  const options: OnboardingPasskeyOption[] = []

  const add = (credentialId: string | undefined, smartAccountAddress?: string) => {
    const id = credentialId?.trim()
    if (!id || seen.has(id)) return
    seen.add(id)
    options.push({ credentialId: id, smartAccountAddress })
  }

  for (const account of accounts) {
    add(account.credentialId, account.smartAccountAddress)
  }

  const begin = webauthnBeginOptionsToObject(optionsJSON)
  const allow = begin?.allowCredentials
  if (Array.isArray(allow)) {
    for (const cred of allow) {
      if (!cred || typeof cred !== 'object') continue
      const id = (cred as { id?: unknown }).id
      if (typeof id === 'string') add(id)
    }
  }

  return options
}

export function useOnboardingPasskeyAuthentication(active: boolean) {
  const prefetchRef = useRef<PrefetchState | null>(null)
  const [passkeys, setPasskeys] = useState<OnboardingPasskeyOption[]>([])
  const [selectedCredentialId, setSelectedCredentialId] = useState<string | null>(null)
  const [prefetchReady, setPrefetchReady] = useState(false)
  const [prefetchError, setPrefetchError] = useState<string | null>(null)
  const [prefetchNonce, setPrefetchNonce] = useState(0)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    if (!active) {
      prefetchRef.current = null
      setPasskeys([])
      setSelectedCredentialId(null)
      setPrefetchReady(false)
      setPrefetchError(null)
      setActionError(null)
      setBusy(false)
      return
    }

    let cancelled = false
    setPrefetchReady(false)
    setPrefetchError(null)
    prefetchRef.current = null

    void (async () => {
      try {
        const [backendRes, localRes, beginRes] = await Promise.all([
          sendToBackground<undefined, BackendAccountsResponse>({
            type: 'GET_BACKEND_ACCOUNTS',
            payload: undefined,
          }),
          sendToBackground<undefined, GetAccountsResponse>({
            type: 'GET_ACCOUNTS',
            payload: undefined,
          }),
          sendToBackground<undefined, BackendWebauthnBeginResponse>({
            type: 'PASSKEY_AUTH_BEGIN',
            payload: undefined,
          }),
        ])
        if (cancelled) return

        if (!beginRes.ok) throw new Error(friendlyError(beginRes.error))

        const optionsJSON = prepareAuthenticationOptionsForGet(beginRes.data?.options)
        assertBeginOptionsRpIdMatchesExtension(optionsJSON)

        const mergedAccounts: BackendSessionAccount[] = [
          ...(backendRes.ok ? (backendRes.data?.accounts ?? []) : []),
          ...(localRes.ok ? (localRes.data?.accounts ?? []) : [])
            .filter((a) => a.mode === 'passkey' && a.passkeyCredentialId)
            .map((a) => ({
              credentialId: a.passkeyCredentialId,
              smartAccountAddress: a.smartAccountAddress,
            })),
        ]

        prefetchRef.current = { kind: 'authentication', optionsJSON }

        const listed = mergePasskeyOptions(mergedAccounts, optionsJSON)
        setPasskeys(listed)
        setSelectedCredentialId(listed.length === 1 ? listed[0]!.credentialId : null)

        if (!cancelled) setPrefetchReady(true)
      } catch (e) {
        if (!cancelled) {
          setPrefetchError(e instanceof Error ? e.message : String(e))
          prefetchRef.current = null
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [active, prefetchNonce])

  const authenticate = useCallback(async (): Promise<StoredAccount> => {
    setActionError(null)
    setBusy(true)
    try {
      const pre = prefetchRef.current
      if (!pre || pre.kind !== 'authentication') {
        throw new Error(
          prefetchError ??
            (prefetchReady
              ? 'Passkey session is stale. Go back and try again.'
              : 'Still preparing passkey…')
        )
      }

      const narrowed = selectedCredentialId
        ? narrowAuthenticationOptionsToCredential(pre.optionsJSON, selectedCredentialId)
        : pre.optionsJSON
      const optionsJSON = prepareAuthenticationOptionsForGet(narrowed)
      assertBeginOptionsRpIdMatchesExtension(optionsJSON)

      let assertion: Awaited<ReturnType<typeof startAuthentication>>
      try {
        assertion = await startAuthentication({
          optionsJSON,
        } as Parameters<typeof startAuthentication>[0])
      } catch (e) {
        throw new Error(formatWebauthnBrowserError(e))
      }

      const res = await sendToBackground<
        { response: unknown },
        BackendWebauthnAuthenticationFinishResponse & {
          account: StoredAccount
        }
      >({
        type: 'PASSKEY_AUTH_FINISH',
        payload: { response: assertion },
      })

      if (!res.ok) {
        const errMsg = friendlyError(res.error)
        throw new Error(
          await enrichWebauthnRpIdHashErrorMessage(errMsg, {
            optionsJSON,
            credentialResponse: assertion,
          })
        )
      }

      const account = res.data!.account
      const setupReq: SetSetupStateRequest = {
        setupState: 'has_account',
        accountPublicKey: res.data!.smartAccountAddress,
      }
      await sendToBackground<SetSetupStateRequest, unknown>({
        type: 'SET_SETUP_STATE',
        payload: setupReq,
      })

      return account
    } catch (e) {
      setPrefetchNonce((n) => n + 1)
      const msg = e instanceof Error ? e.message : String(e)
      setActionError(msg)
      throw e
    } finally {
      setBusy(false)
    }
  }, [prefetchError, prefetchReady, selectedCredentialId])

  return {
    passkeys,
    selectedCredentialId,
    setSelectedCredentialId,
    prefetchReady,
    prefetchError,
    actionError,
    busy,
    authenticate,
  }
}
