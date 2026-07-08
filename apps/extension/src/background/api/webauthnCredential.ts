function bytesToBase64Url(bytes: Uint8Array): string {
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  const b64 = btoa(bin)
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function isSerializedBuffer(value: object): value is { type: 'Buffer'; data: number[] } {
  return (
    'type' in value &&
    (value as { type: unknown }).type === 'Buffer' &&
    'data' in value &&
    Array.isArray((value as { data: unknown }).data)
  )
}

function coerceToUint8Array(value: unknown): Uint8Array | null {
  if (value instanceof ArrayBuffer) return new Uint8Array(value)
  if (value instanceof Uint8Array) return value
  if (typeof value === 'string') {
    try {
      const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (value.length % 4)) % 4)
      const bin = atob(padded)
      const out = new Uint8Array(bin.length)
      for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
      return out
    } catch {
      return null
    }
  }
  if (value != null && typeof value === 'object' && isSerializedBuffer(value)) {
    return Uint8Array.from(value.data)
  }
  return null
}

function coerceBase64UrlField(value: unknown, label: string): string {
  if (typeof value === 'string' && value.length > 0) return value
  const bytes = coerceToUint8Array(value)
  if (bytes) return bytesToBase64Url(bytes)
  throw new Error(`WebAuthn credential field "${label}" is not valid base64url`)
}

function normalizeInnerResponse(
  inner: Record<string, unknown>,
  ceremony: 'registration' | 'authentication'
): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  if ('clientDataJSON' in inner) {
    out.clientDataJSON = coerceBase64UrlField(inner.clientDataJSON, 'clientDataJSON')
  }
  if ('attestationObject' in inner) {
    out.attestationObject = coerceBase64UrlField(inner.attestationObject, 'attestationObject')
  }
  if (ceremony === 'authentication' && 'authenticatorData' in inner) {
    out.authenticatorData = coerceBase64UrlField(inner.authenticatorData, 'authenticatorData')
  }
  if (ceremony === 'authentication' && 'signature' in inner) {
    out.signature = coerceBase64UrlField(inner.signature, 'signature')
  }
  if ('userHandle' in inner && inner.userHandle != null && inner.userHandle !== '') {
    out.userHandle = coerceBase64UrlField(inner.userHandle, 'userHandle')
  }
  return out
}

function decodeBase64UrlToUtf8(value: string): string | null {
  try {
    const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (value.length % 4)) % 4)
    const bin = atob(padded)
    const out = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
    return new TextDecoder().decode(out)
  } catch {
    return null
  }
}

/** Reads WebAuthn `challenge` from credential `clientDataJSON`. */
export function challengeFromWebauthnCredential(credential: unknown): string | undefined {
  const inner = (credential as { response?: unknown } | null)?.response
  if (!inner || typeof inner !== 'object') return undefined
  const clientDataJSON = (inner as { clientDataJSON?: unknown }).clientDataJSON
  if (typeof clientDataJSON !== 'string' || !clientDataJSON) return undefined
  const decoded = decodeBase64UrlToUtf8(clientDataJSON)
  if (!decoded) return undefined
  try {
    const parsed = JSON.parse(decoded) as { challenge?: unknown }
    return typeof parsed.challenge === 'string' ? parsed.challenge : undefined
  } catch {
    return undefined
  }
}

/**
 * Normalize a @simplewebauthn/browser credential after `chrome.runtime.sendMessage`
 * so API `/finish` routes receive base64url strings (not ArrayBuffers / Buffer JSON).
 */
export function normalizeWebauthnCredentialForApi(
  credential: unknown,
  ceremony: 'registration' | 'authentication' = 'authentication'
): Record<string, unknown> {
  if (!credential || typeof credential !== 'object') {
    throw new Error('Missing WebAuthn credential response')
  }
  const cred = credential as Record<string, unknown>
  const inner = cred.response
  if (!inner || typeof inner !== 'object') {
    throw new Error('Missing WebAuthn credential.response')
  }

  let id: string
  let rawId: string
  const serializedRawId =
    cred.rawId != null && typeof cred.rawId === 'object' ? coerceToUint8Array(cred.rawId) : null
  if (serializedRawId) {
    rawId = bytesToBase64Url(serializedRawId)
    id = rawId
  } else {
    rawId = coerceBase64UrlField(cred.rawId ?? cred.id, 'rawId')
    id = coerceBase64UrlField(cred.id ?? rawId, 'id')
    if (id !== rawId) {
      // Prefer rawId bytes encoding when id/rawId strings disagree after message-passing.
      const fromId = coerceToUint8Array(cred.id)
      const fromRawId = coerceToUint8Array(cred.rawId)
      if (fromId && fromRawId) {
        rawId = bytesToBase64Url(fromRawId)
        id = rawId
      }
    }
  }

  return {
    id,
    rawId,
    type: 'public-key',
    response: normalizeInnerResponse(inner as Record<string, unknown>, ceremony),
  }
}
