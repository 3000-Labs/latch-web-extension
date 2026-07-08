import type { V1TokenPair } from '@latch/types'

import { latchApiBaseUrl } from './config'
import { BackendError } from './client'
import { getV1TokenPair, isTokenFresh, setV1TokenPair } from './v1TokenStorage'
import { buildWalletSignInBodyFromAssertion } from './v1WalletSignIn'

export { base64UrlToStandardB64, buildWalletSignInBodyFromAssertion } from './v1WalletSignIn'

type V1Envelope<T> = { data?: T; error?: { code?: string; message?: string } }

function unwrapV1<T>(data: unknown, _path: string): T {
  if (data && typeof data === 'object' && 'data' in data) {
    return (data as V1Envelope<T>).data as T
  }
  return data as T
}

export async function v1FetchAbsolute<T>(
  url: string,
  init?: RequestInit & { accessToken?: string; timeoutMs?: number }
): Promise<T> {
  const controller = new AbortController()
  const timeoutMs = init?.timeoutMs ?? 20_000
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const headers: Record<string, string> = {
      'content-type': 'application/json',
      ...(init?.headers as Record<string, string> | undefined),
    }
    if (init?.accessToken) {
      headers.authorization = `Bearer ${init.accessToken}`
    }

    const res = await fetch(url, {
      ...init,
      credentials: 'omit',
      signal: controller.signal,
      headers,
    })

    const text = await res.text()
    let json: unknown
    try {
      json = text ? JSON.parse(text) : undefined
    } catch {
      throw new BackendError(`v1 API invalid JSON (${res.status}) for ${url}`, { status: res.status })
    }

    if (!res.ok) {
      const err = (json as V1Envelope<unknown>)?.error
      throw new BackendError(err?.message ?? `v1 request failed (${res.status})`, {
        status: res.status,
        code: err?.code,
        details: json,
      })
    }

    return unwrapV1<T>(json, url)
  } catch (err) {
    if (err instanceof BackendError) throw err
    if (err instanceof Error && err.name === 'AbortError') {
      throw new BackendError('Request timed out', { code: 'timeout' })
    }
    throw new BackendError(err instanceof Error ? err.message : String(err))
  } finally {
    clearTimeout(timeout)
  }
}

export async function v1Fetch<T>(
  path: string,
  init?: RequestInit & { accessToken?: string; timeoutMs?: number }
): Promise<T> {
  const baseUrl = latchApiBaseUrl()
  return v1FetchAbsolute<T>(`${baseUrl}${path}`, init)
}

export async function v1FetchForWallet<T>(
  wallet: string,
  path: string,
  init?: RequestInit & { timeoutMs?: number }
): Promise<T> {
  const token = await resolveAccessToken(wallet)
  return v1Fetch<T>(path, { ...init, accessToken: token })
}

export async function resolveAccessToken(wallet: string): Promise<string> {
  const pair = await getV1TokenPair(wallet)
  if (!pair) {
    throw new BackendError('V1 auth required', { code: 'V1_AUTH_REQUIRED' })
  }
  if (isTokenFresh(pair)) return pair.accessToken
  const refreshed = await refreshV1Tokens(pair.refreshToken)
  const next: V1TokenPair = {
    ...refreshed,
    wallet: wallet.trim(),
  }
  await setV1TokenPair(wallet, next)
  return next.accessToken
}

export async function refreshV1Tokens(refreshToken: string): Promise<V1TokenPair> {
  const data = await v1Fetch<{ access_token: string; refresh_token: string; expires_in: number }>(
    '/v1/auth/refresh',
    {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    }
  )
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + (data.expires_in ?? 900) * 1000,
    wallet: '',
  }
}

export async function requestWalletChallenge(wallet: string, keyType: string): Promise<Record<string, unknown>> {
  const body: Record<string, unknown> = { wallet, key_type: keyType }
  if (typeof chrome !== 'undefined' && chrome.runtime?.id) {
    body.chromeExtensionId = chrome.runtime.id
  }
  return v1Fetch<Record<string, unknown>>('/v1/auth/challenge', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function completeWalletSignIn(body: Record<string, unknown>): Promise<V1TokenPair> {
  // Passkey wallet sign-in verifies against on-chain key_data_hex; chromeExtensionId makes the
  // server apply bare extension-id rpId checks that fail for chrome-extension:// origins.
  const isPasskeySignIn = typeof body.passkey_signature === 'string'
  if (
    !isPasskeySignIn &&
    typeof chrome !== 'undefined' &&
    chrome.runtime?.id
  ) {
    body.chromeExtensionId = chrome.runtime.id
  }
  const data = await v1Fetch<{
    access_token: string
    refresh_token: string
    expires_in: number
  }>('/v1/auth/sign-in', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  const wallet = String(body.wallet ?? '').trim()
  const pair: V1TokenPair = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + (data.expires_in ?? 900) * 1000,
    wallet,
  }
  if (wallet) await setV1TokenPair(wallet, pair)
  return pair
}

export async function completeWalletSignInFromAssertion(args: {
  wallet: string
  keyType: string
  nonce: string
  assertion: unknown
  keyDataHex?: string
}): Promise<V1TokenPair> {
  const body = buildWalletSignInBodyFromAssertion(args)
  return completeWalletSignIn(body)
}
