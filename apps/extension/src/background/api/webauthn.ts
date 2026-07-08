import type {
  BackendWebauthnAuthenticationFinishRequest,
  BackendWebauthnAuthenticationFinishResponse,
  BackendWebauthnBeginResponse,
  BackendWebauthnRegistrationFinishRequest,
  BackendWebauthnRegistrationFinishResponse,
} from '@latch/types'

import { latchFetch } from './client'
import { normalizeWebauthnCredentialForApi } from './webauthnCredential'

/** When set, WebAuthn `/begin` routes should use `rp.id === chromeExtensionId` (Chrome extension WebAuthn). */
function chromeExtensionIdForWebauthn(): string | undefined {
  try {
    if (
      typeof chrome !== 'undefined' &&
      typeof chrome.runtime?.id === 'string' &&
      chrome.runtime.id.length > 0
    ) {
      return chrome.runtime.id
    }
  } catch {
    // ignore
  }
  return undefined
}

export function webauthnBeginBody(extra: Record<string, unknown> = {}): string {
  const id = chromeExtensionIdForWebauthn()
  return JSON.stringify({
    ...extra,
    ...(id ? { chromeExtensionId: id } : {}),
  })
}

/** JSON body for transaction submit routes that accept optional `chromeExtensionId`. */
export function latchExtensionJsonBody(payload: object): string {
  const id = chromeExtensionIdForWebauthn()
  return JSON.stringify({
    ...payload,
    ...(id ? { chromeExtensionId: id } : {}),
  })
}

export function webauthnFinishBody(
  payload: object,
  ceremony: 'registration' | 'authentication'
): string {
  const id = chromeExtensionIdForWebauthn()
  const body = payload as Record<string, unknown>
  const response = body.response
  const normalizedResponse =
    response != null ? normalizeWebauthnCredentialForApi(response, ceremony) : response

  return JSON.stringify({
    ...body,
    ...(normalizedResponse != null ? { response: normalizedResponse } : {}),
    ...(id ? { chromeExtensionId: id } : {}),
  })
}

export async function passkeyRegistrationBegin(args?: {
  displayName?: string
}): Promise<BackendWebauthnBeginResponse> {
  const extra: Record<string, unknown> = {}
  if (args?.displayName !== undefined && args.displayName !== '') {
    extra.displayName = args.displayName
  }
  return latchFetch<BackendWebauthnBeginResponse>('/api/webauthn/registration/begin', {
    method: 'POST',
    body: webauthnBeginBody(extra),
  })
}

export async function passkeyRegistrationFinish(
  req: BackendWebauthnRegistrationFinishRequest
): Promise<BackendWebauthnRegistrationFinishResponse> {
  return latchFetch<BackendWebauthnRegistrationFinishResponse>(
    '/api/webauthn/registration/finish',
    {
      method: 'POST',
      body: webauthnFinishBody(req, 'registration'),
    }
  )
}

export async function passkeyAuthenticationBegin(): Promise<BackendWebauthnBeginResponse> {
  return latchFetch<BackendWebauthnBeginResponse>('/api/webauthn/authentication/begin', {
    method: 'POST',
    body: webauthnBeginBody({}),
  })
}

/** Wallet-scoped WebAuthn begin for `/v1/auth/sign-in` (sets extension rpId). */
export async function passkeyAuthenticationBeginForWallet(
  wallet: string,
  keyType: string
): Promise<BackendWebauthnBeginResponse> {
  return latchFetch<BackendWebauthnBeginResponse>('/api/webauthn/authentication/begin', {
    method: 'POST',
    body: webauthnBeginBody({ wallet: wallet.trim(), key_type: keyType }),
  })
}

export async function passkeyAuthenticationFinish(
  req: BackendWebauthnAuthenticationFinishRequest
): Promise<BackendWebauthnAuthenticationFinishResponse> {
  return latchFetch<BackendWebauthnAuthenticationFinishResponse>(
    '/api/webauthn/authentication/finish',
    {
      method: 'POST',
      body: webauthnFinishBody(req, 'authentication'),
    }
  )
}
