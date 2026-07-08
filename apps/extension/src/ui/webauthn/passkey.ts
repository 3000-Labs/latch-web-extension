import type { StoredAccount } from '@latch/types'
import { p256 } from '@noble/curves/nist.js'
import { decodeMultiple } from 'cbor-x'
import { xdr } from '@stellar/stellar-sdk'

import {
  base64UrlToBytes,
  bytesToBase64Url,
  bytesToHex,
  concatBytes,
  hexToBytes,
} from './utils'

/** WebAuthn `user.displayName` for the next passkey registration (1-based, counts existing local passkey accounts). */
export function nextPasskeyAccountDisplayName(accounts: StoredAccount[]): string {
  const passkeyCount = accounts.reduce((n, a) => n + (a.mode === 'passkey' ? 1 : 0), 0)
  return `Latch account ${passkeyCount + 1}`
}

/** Unique WebAuthn display name for a new passkey in a specific flow (e.g. multisig). */
export function nextPasskeyRegistrationDisplayName(
  accounts: StoredAccount[],
  context?: string
): string {
  const base = nextPasskeyAccountDisplayName(accounts)
  const ctx = context?.trim()
  return ctx ? `${base} · ${ctx}` : base
}

export type PasskeyRegistrationResult = {
  credentialId: string
  credentialIdBytes: Uint8Array
  publicKeyUncompressed: Uint8Array // 65 bytes, 0x04 || x || y
  keyDataHex: string
}

export type PasskeyAssertionResult = {
  authenticatorData: Uint8Array
  clientDataJson: Uint8Array
  signatureCompact: Uint8Array // 64 bytes r||s low-S
  sigDataXdrHex: string
}

function readUint16BE(bytes: Uint8Array, offset: number): number {
  return (bytes[offset] << 8) | bytes[offset + 1]
}

function ensureLen(bytes: Uint8Array, len: number, label: string) {
  if (bytes.length !== len) throw new Error(`${label} must be ${len} bytes`)
}

function decodeFirstCborItem(bytes: Uint8Array): unknown {
  // cbor-x decodeMultiple lets us parse the first item even if there are trailing bytes
  for (const item of decodeMultiple(bytes)) return item
  throw new Error('Failed to decode CBOR')
}

function parseAttestationObject(attestationObjectB64Url: string): {
  authData: Uint8Array
} {
  const bytes = base64UrlToBytes(attestationObjectB64Url)
  const obj = decodeFirstCborItem(bytes) as any
  const authData = obj?.authData
  if (!(authData instanceof Uint8Array)) throw new Error('Invalid attestationObject.authData')
  return { authData }
}

function coseToUncompressedP256(coseKey: any): Uint8Array {
  // COSE_Key fields: -2 => x, -3 => y
  const x = coseKey?.[-2]
  const y = coseKey?.[-3]
  if (!(x instanceof Uint8Array) || !(y instanceof Uint8Array))
    throw new Error('Invalid COSE key (missing x/y)')
  ensureLen(x, 32, 'P-256 x')
  ensureLen(y, 32, 'P-256 y')
  return concatBytes(new Uint8Array([0x04]), concatBytes(x, y))
}

export function extractRegistrationKeyData(registrationResponse: any): PasskeyRegistrationResult {
  const attObj = registrationResponse?.response?.attestationObject
  const credentialId = registrationResponse?.id
  if (typeof attObj !== 'string') throw new Error('Missing attestationObject')
  if (typeof credentialId !== 'string') throw new Error('Missing credential id')

  const { authData } = parseAttestationObject(attObj)

  // authenticatorData layout:
  // rpIdHash(32) || flags(1) || signCount(4) || attestedCredentialData(if flags&0x40) ...
  const flags = authData[32]
  const hasAttestedCredData = (flags & 0x40) !== 0
  if (!hasAttestedCredData) throw new Error('Attested credential data missing in authenticatorData')

  let offset = 32 + 1 + 4
  offset += 16 // AAGUID
  const credIdLen = readUint16BE(authData, offset)
  offset += 2
  const credentialIdBytes = authData.slice(offset, offset + credIdLen)
  offset += credIdLen

  const coseBytes = authData.slice(offset)
  const coseKey = decodeFirstCborItem(coseBytes)
  const publicKeyUncompressed = coseToUncompressedP256(coseKey)

  const keyDataBytes = concatBytes(publicKeyUncompressed, credentialIdBytes)
  const keyDataHex = bytesToHex(keyDataBytes)

  return { credentialId, credentialIdBytes, publicKeyUncompressed, keyDataHex }
}

function derToRs(der: Uint8Array): { r: bigint; s: bigint } {
  // Minimal ASN.1 DER parser for ECDSA signature: SEQUENCE(INTEGER r, INTEGER s)
  let i = 0
  const expect = (v: number) => {
    if (der[i] !== v) throw new Error('Invalid DER signature')
    i++
  }
  const readLen = () => {
    const b = der[i++]
    if (b < 0x80) return b
    const n = b & 0x7f
    let len = 0
    for (let k = 0; k < n; k++) len = (len << 8) | der[i++]
    return len
  }
  const readInt = (): bigint => {
    expect(0x02)
    const len = readLen()
    const bytes = der.slice(i, i + len)
    i += len
    // remove leading 0x00
    let start = 0
    while (start < bytes.length - 1 && bytes[start] === 0) start++
    let x = 0n
    for (const b of bytes.slice(start)) x = (x << 8n) | BigInt(b)
    return x
  }

  expect(0x30)
  readLen()
  const r = readInt()
  const s = readInt()
  return { r, s }
}

function bigintTo32Bytes(x: bigint): Uint8Array {
  const out = new Uint8Array(32)
  let v = x
  for (let i = 31; i >= 0; i--) {
    out[i] = Number(v & 0xffn)
    v >>= 8n
  }
  return out
}

/** Scalar field order n for P-256 (noble/curves v2: use `Point.Fn.ORDER`, not `CURVE.n`). */
const P256_ORDER = p256.Point.Fn.ORDER

export function toLowSCompactSignatureP256(derSignature: Uint8Array): Uint8Array {
  const { r, s } = derToRs(derSignature)
  const lowS = s > P256_ORDER / 2n ? P256_ORDER - s : s
  const rBytes = bigintTo32Bytes(r)
  const sBytes = bigintTo32Bytes(lowS)
  return concatBytes(rBytes, sBytes)
}

export function buildWebauthnSigDataXdrHex(args: {
  authenticatorData: Uint8Array
  clientDataJson: Uint8Array
  signatureCompact: Uint8Array
}): string {
  const entries = [
    ['authenticator_data', args.authenticatorData],
    ['client_data', args.clientDataJson],
    ['signature', args.signatureCompact],
  ].map(
    ([k, v]) =>
      new xdr.ScMapEntry({
        key: xdr.ScVal.scvSymbol(k),
        val: xdr.ScVal.scvBytes(v as Uint8Array),
      })
  )

  const scVal = xdr.ScVal.scvMap(entries)
  const raw = scVal.toXDR() as unknown as Uint8Array
  return bytesToHex(raw instanceof Uint8Array ? raw : new Uint8Array(raw as any))
}

export function createLocalRegistrationOptions(rpId: string) {
  const challenge = crypto.getRandomValues(new Uint8Array(32))
  const userId = crypto.getRandomValues(new Uint8Array(32))
  return {
    challenge: bytesToBase64Url(challenge),
    rp: { name: 'Latch', id: rpId },
    user: {
      id: bytesToBase64Url(userId),
      name: `user@${rpId}`,
      displayName: 'Latch user',
    },
    pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
    authenticatorSelection: {
      residentKey: 'required',
      userVerification: 'required',
    },
    timeout: 60_000,
    attestation: 'none',
  } as const
}

/** Prefer this device's platform passkey over cross-device / QR (hybrid) flows. */
const PLATFORM_PASSKEY_HINTS = ['client-device'] as const
const PLATFORM_PASSKEY_TRANSPORTS = ['internal'] as const

function normalizeAllowCredentialsForPlatform(allow: unknown): unknown[] {
  if (!Array.isArray(allow) || allow.length === 0) return []
  return allow.map((cred) => {
    if (!cred || typeof cred !== 'object') return cred
    const c = cred as Record<string, unknown>
    return {
      ...c,
      type: c.type ?? 'public-key',
      transports: PLATFORM_PASSKEY_TRANSPORTS,
    }
  })
}

export function createLocalAuthenticationOptions(args: {
  rpId: string
  credentialId: string
  authDigestHex: string
}) {
  const challenge = hexToBytes(args.authDigestHex)
  return {
    rpId: args.rpId,
    challenge: bytesToBase64Url(challenge),
    allowCredentials: [
      {
        id: args.credentialId,
        type: 'public-key',
        transports: PLATFORM_PASSKEY_TRANSPORTS,
      },
    ],
    timeout: 60_000,
    userVerification: 'required',
    hints: PLATFORM_PASSKEY_HINTS,
  } as const
}

/** Chrome extension id used as WebAuthn `rpId` for smart-account auth (not session login). */
export function extensionWebauthnRpId(): string {
  const extId =
    typeof chrome !== 'undefined' &&
    typeof chrome.runtime?.id === 'string' &&
    chrome.runtime.id.length > 0
      ? chrome.runtime.id
      : ''
  if (!extId) {
    throw new Error('WebAuthn for transactions requires the Chrome extension context.')
  }
  return extId
}

/**
 * WebAuthn options for signing a smart-account auth entry.
 * Challenge must be the build response `authDigestHex` (not PASSKEY_AUTH_BEGIN session challenge).
 */
export function normalizeAuthDigestHex(authDigestHex: string): string {
  const hex = authDigestHex.trim().replace(/^0x/i, '')
  if (!/^[0-9a-fA-F]+$/.test(hex) || hex.length % 2 !== 0) {
    throw new Error('Invalid auth digest from transaction build.')
  }
  return hex
}

export function authDigestChallengeBase64Url(authDigestHex: string): string {
  return bytesToBase64Url(hexToBytes(normalizeAuthDigestHex(authDigestHex)))
}

export function challengeBase64UrlFromWebauthnAssertion(assertion: unknown): string | undefined {
  const resp = (assertion as { response?: { clientDataJSON?: unknown } } | null)?.response
  if (!resp || typeof resp !== 'object') return undefined
  const clientDataJSON = (resp as { clientDataJSON?: unknown }).clientDataJSON
  if (typeof clientDataJSON !== 'string' || !clientDataJSON) return undefined
  try {
    const parsed = JSON.parse(
      new TextDecoder().decode(base64UrlToBytes(clientDataJSON))
    ) as { challenge?: unknown }
    return typeof parsed.challenge === 'string' ? parsed.challenge : undefined
  } catch {
    return undefined
  }
}

/**
 * Ensures the passkey signed this transaction's auth digest (not a login/session challenge).
 */
export function assertPasskeyAssertionMatchesAuthDigest(
  assertion: unknown,
  authDigestHex: string
): void {
  const expected = authDigestChallengeBase64Url(authDigestHex)
  const signed = challengeBase64UrlFromWebauthnAssertion(assertion)
  if (!signed) {
    throw new Error('Passkey response did not include a WebAuthn challenge.')
  }
  if (signed !== expected) {
    throw new Error(
      'Passkey signed the wrong challenge for this transaction. ' +
        'Complete only the passkey prompt opened from Send or Swap, then try again.'
    )
  }
  const ceremony = getWebauthnCeremonyTypeFromCredential(assertion)
  if (ceremony === 'webauthn.create') {
    throw new Error('Passkey registration was used instead of signing this transaction.')
  }
}

export function passkeyAuthenticationOptionsForAuthDigest(args: {
  credentialId: string
  authDigestHex: string
  rpId?: string
}) {
  const hex = normalizeAuthDigestHex(args.authDigestHex)
  return createLocalAuthenticationOptions({
    rpId: args.rpId ?? extensionWebauthnRpId(),
    credentialId: args.credentialId,
    authDigestHex: hex,
  })
}

/** WebAuthn options for `/v1/auth/challenge` wallet sign-in (nonce is already base64url). */
export function passkeyAuthenticationOptionsForV1Challenge(args: {
  credentialId: string
  challengeBase64Url: string
  rpId?: string
}) {
  const challenge = args.challengeBase64Url.trim()
  if (!challenge) throw new Error('V1 auth challenge missing nonce')
  return {
    rpId: args.rpId ?? extensionWebauthnRpId(),
    challenge,
    allowCredentials: [
      {
        id: args.credentialId,
        type: 'public-key',
        transports: PLATFORM_PASSKEY_TRANSPORTS,
      },
    ],
    timeout: 60_000,
    userVerification: 'required',
    hints: PLATFORM_PASSKEY_HINTS,
  } as const
}

export function assertPasskeyAssertionMatchesV1Challenge(
  assertion: unknown,
  challengeBase64Url: string
): void {
  const expected = challengeBase64Url.trim()
  const signed = challengeBase64UrlFromWebauthnAssertion(assertion)
  if (!signed) {
    throw new Error('Passkey response did not include a WebAuthn challenge.')
  }
  if (signed !== expected) {
    throw new Error('Passkey signed the wrong V1 auth challenge. Try again.')
  }
}

export function buildPasskeySigDataXdrFromAssertion(assertion: unknown): string {
  const parsed = parseAuthenticationResponse(assertion)
  return buildWebauthnSigDataXdrHex({
    authenticatorData: parsed.authenticatorData,
    clientDataJson: parsed.clientDataJson,
    signatureCompact: parsed.signatureCompact,
  })
}

export function parseAuthenticationResponse(
  authResponse: any
): Omit<PasskeyAssertionResult, 'sigDataXdrHex'> {
  const resp = authResponse?.response
  const authenticatorData = base64UrlToBytes(resp?.authenticatorData)
  const clientDataJson = base64UrlToBytes(resp?.clientDataJSON)
  const signatureDer = base64UrlToBytes(resp?.signature)
  const signatureCompact = toLowSCompactSignatureP256(signatureDer)
  return { authenticatorData, clientDataJson, signatureCompact }
}

function readErrorCauseMessage(cause: unknown): string | undefined {
  if (cause instanceof Error) return cause.message
  if (
    cause &&
    typeof cause === 'object' &&
    'message' in cause &&
    typeof (cause as { message: unknown }).message === 'string'
  ) {
    return (cause as { message: string }).message
  }
  return undefined
}

/**
 * Maps @simplewebauthn/browser start errors to clearer text on extension pages.
 * `ERROR_INVALID_DOMAIN` often masks the real SecurityError in `cause`.
 */
/** Parse begin `options` whether the API returns an object or a JSON string. */
export function webauthnBeginOptionsToObject(options: unknown): Record<string, unknown> | null {
  if (options == null) return null
  if (typeof options === 'string') {
    try {
      const o = JSON.parse(options) as unknown
      if (typeof o === 'object' && o !== null && !Array.isArray(o))
        return o as Record<string, unknown>
      return null
    } catch {
      return null
    }
  }
  if (typeof options === 'object' && !Array.isArray(options))
    return options as Record<string, unknown>
  return null
}

/**
 * Reads rp.id (registration) or rpId (authentication) from WebAuthn begin options.
 */
export function getWebauthnRpIdFromBeginOptions(options: unknown): string | undefined {
  const o = webauthnBeginOptionsToObject(options)
  if (!o) return undefined
  const rp = o.rp as { id?: unknown } | undefined
  if (rp && typeof rp.id === 'string') return rp.id
  if (typeof o.rpId === 'string') return o.rpId
  return undefined
}

/**
 * Ensures server-issued options match extension WebAuthn (rp.id / rpId === chrome.runtime.id).
 * No-op when not on a chrome-extension page (e.g. unit tests without extension globals).
 */
/** Restrict authentication begin options to one passkey when the user picked it in the UI. */
export function narrowAuthenticationOptionsToCredential(
  options: unknown,
  credentialId: string
): unknown {
  const o = webauthnBeginOptionsToObject(options)
  if (!o) return options

  const allow = o.allowCredentials
  if (!Array.isArray(allow) || allow.length === 0) {
    return {
      ...o,
      allowCredentials: [{ id: credentialId, type: 'public-key', transports: PLATFORM_PASSKEY_TRANSPORTS }],
    }
  }

  const narrowed = allow.filter((cred) => {
    if (!cred || typeof cred !== 'object') return false
    const id = (cred as { id?: unknown }).id
    return id === credentialId
  })

  return {
    ...o,
    allowCredentials:
      narrowed.length > 0
        ? normalizeAllowCredentialsForPlatform(narrowed)
        : [{ id: credentialId, type: 'public-key', transports: PLATFORM_PASSKEY_TRANSPORTS }],
  }
}

export function assertBeginOptionsRpIdMatchesExtension(options: unknown): void {
  const protocol = typeof window !== 'undefined' ? window.location.protocol : ''
  if (protocol !== 'chrome-extension:') return

  const extId =
    typeof chrome !== 'undefined' &&
    typeof chrome.runtime?.id === 'string' &&
    chrome.runtime.id.length > 0
      ? chrome.runtime.id
      : ''
  if (!extId) return

  const rpId = getWebauthnRpIdFromBeginOptions(options)
  if (rpId === undefined) {
    throw new Error(
      [
        'WebAuthn options from the server are missing rp.id (registration) or rpId (authentication).',
        'The Latch API must return options built for this Chrome extension when chromeExtensionId is sent on begin.',
      ].join(' ')
    )
  }
  if (rpId !== extId) {
    throw new Error(
      [
        `WebAuthn RP mismatch: the server set rp.id/rpId to "${rpId}" but this extension's id is "${extId}".`,
        'Registration/authentication will fail verification. Fix the API to set rp.id (and verify with expectedRPID) to chrome.runtime.id from chromeExtensionId.',
      ].join(' ')
    )
  }
}

export function formatWebauthnBrowserError(err: unknown): string {
  if (!(err instanceof Error)) return String(err)

  const code = (err as { code?: string }).code
  const causeMsg = readErrorCauseMessage((err as { cause?: unknown }).cause)
  const protocol = typeof window !== 'undefined' ? window.location.protocol : ''

  if (code === 'ERROR_INVALID_DOMAIN' && protocol === 'chrome-extension:') {
    const extId =
      typeof chrome !== 'undefined' && chrome.runtime?.id ? chrome.runtime.id : 'your-extension-id'
    const parts = [
      'WebAuthn failed in the extension.',
      causeMsg ? `Details: ${causeMsg}` : undefined,
      `The server must receive chromeExtensionId and set WebAuthn rp.id to "${extId}" (same as chrome.runtime.id).`,
    ].filter(Boolean)
    return parts.join(' ')
  }

  if (causeMsg) return `${err.message} (${causeMsg})`
  return err.message
}

/** SimpleWebAuthn server throws this when `authenticatorData` rpIdHash does not match any expected RP ID (SHA-256). */
const UNEXPECTED_RP_ID_HASH_RE = /unexpected\s+rp\s*id\s*hash/i

async function sha256HexUtf8(rpId: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(rpId))
  return bytesToHex(new Uint8Array(digest))
}

/**
 * Reads the first 32 bytes of `authenticatorData` (WebAuthn rpIdHash) from a credential returned by
 * `startRegistration` / `startAuthentication` (JSON shape).
 */
export function readAuthenticatorRpIdHashHexFromCredentialJSON(credential: unknown): string | null {
  const resp = (credential as { response?: unknown } | null)?.response
  if (!resp || typeof resp !== 'object') return null
  const r = resp as Record<string, unknown>
  try {
    if (typeof r.authenticatorData === 'string' && r.authenticatorData.length > 0) {
      const d = base64UrlToBytes(r.authenticatorData)
      if (d.length < 32) return null
      return bytesToHex(d.subarray(0, 32))
    }
    if (typeof r.attestationObject === 'string') {
      const { authData } = parseAttestationObject(r.attestationObject)
      if (authData.length < 32) return null
      return bytesToHex(authData.subarray(0, 32))
    }
  } catch {
    return null
  }
  return null
}

/**
 * When the Latch API returns SimpleWebAuthn's `Unexpected RP ID hash`, append local diagnostics:
 * rpId from begin options, SHA-256(rpId) as the verifier expects, and rpIdHash from the credential's authData.
 */
export async function enrichWebauthnRpIdHashErrorMessage(
  message: string,
  ctx: { optionsJSON?: unknown; credentialResponse?: unknown }
): Promise<string> {
  if (!UNEXPECTED_RP_ID_HASH_RE.test(message)) return message

  const parts: string[] = [message]
  const rpId =
    ctx.optionsJSON !== undefined ? getWebauthnRpIdFromBeginOptions(ctx.optionsJSON) : undefined

  if (rpId) {
    parts.push(`Begin rp.id/rpId: ${JSON.stringify(rpId)}`)
    parts.push(`SHA-256(rpId) expected by verifier (hex): ${await sha256HexUtf8(rpId)}`)
  } else {
    parts.push('Begin options did not include rp.id or rpId (could not compute expected hash).')
  }

  const fromCred =
    ctx.credentialResponse != null
      ? readAuthenticatorRpIdHashHexFromCredentialJSON(ctx.credentialResponse)
      : null
  if (fromCred) {
    parts.push(`Authenticator rpIdHash from this credential (hex): ${fromCred}`)
  } else {
    parts.push(
      'Could not read rpIdHash from the WebAuthn credential (missing or invalid authenticatorData).'
    )
  }

  const extId =
    typeof chrome !== 'undefined' &&
    typeof chrome.runtime?.id === 'string' &&
    chrome.runtime.id.length > 0
      ? chrome.runtime.id
      : undefined
  if (extId) {
    parts.push(`This extension chrome.runtime.id: ${JSON.stringify(extId)}`)
    parts.push(`SHA-256(chrome.runtime.id) (hex): ${await sha256HexUtf8(extId)}`)
  }

  return parts.join(' ')
}

export type WebauthnCeremonyType = 'webauthn.create' | 'webauthn.get' | 'unknown'

/** Reads `type` from credential `clientDataJSON` (create vs get). */
export function getWebauthnCeremonyTypeFromCredential(credential: unknown): WebauthnCeremonyType {
  const resp = (credential as { response?: unknown } | null)?.response
  if (!resp || typeof resp !== 'object') return 'unknown'
  const clientDataJSON = (resp as { clientDataJSON?: unknown }).clientDataJSON
  if (typeof clientDataJSON !== 'string' || !clientDataJSON) return 'unknown'
  try {
    const parsed = JSON.parse(
      new TextDecoder().decode(base64UrlToBytes(clientDataJSON))
    ) as { type?: unknown }
    if (parsed.type === 'webauthn.create' || parsed.type === 'webauthn.get') {
      return parsed.type
    }
  } catch {
    // ignore
  }
  return 'unknown'
}

export function isRegistrationBeginOptions(options: unknown): boolean {
  const o = webauthnBeginOptionsToObject(options)
  if (!o) return false
  return Array.isArray(o.pubKeyCredParams) && o.user != null && typeof o.user === 'object'
}

/** Validate server begin options for `startRegistration` (do not mutate RP/user/challenge). */
export function prepareRegistrationOptionsForCreate(options: unknown): unknown {
  const o = webauthnBeginOptionsToObject(options)
  if (!o) return options
  if (!isRegistrationBeginOptions(o)) {
    throw new Error(
      'Server returned authentication options instead of registration options. Try again or use “I have a wallet” → Existing passkey.'
    )
  }
  const authSel =
    o.authenticatorSelection != null && typeof o.authenticatorSelection === 'object'
      ? (o.authenticatorSelection as Record<string, unknown>)
      : {}
  return {
    ...o,
    authenticatorSelection: {
      ...authSel,
      authenticatorAttachment: 'platform',
      residentKey: 'required',
      requireResidentKey: true,
      userVerification: authSel.userVerification ?? 'required',
    },
    hints: PLATFORM_PASSKEY_HINTS,
  }
}

export function assertRegistrationCeremonyForFinish(credential: unknown): void {
  const ceremony = getWebauthnCeremonyTypeFromCredential(credential)
  if (ceremony === 'webauthn.get') {
    throw new Error(
      'You signed in with an existing passkey instead of creating a new one. Use “I have a wallet” → Existing passkey.'
    )
  }
  const inner = (credential as { response?: Record<string, unknown> } | null)?.response
  if (!inner || typeof inner.attestationObject !== 'string' || !inner.attestationObject) {
    throw new Error(
      'Passkey creation did not return a registration attestation. Try again or use “I have a wallet” → Existing passkey.'
    )
  }
}

/** Normalize server begin options for `startAuthentication`. */
export function prepareAuthenticationOptionsForGet(options: unknown): unknown {
  const o = webauthnBeginOptionsToObject(options)
  if (!o) return options
  const rpId = getWebauthnRpIdFromBeginOptions(o)
  const out: Record<string, unknown> = {
    ...o,
    userVerification: o.userVerification ?? 'required',
    hints: PLATFORM_PASSKEY_HINTS,
  }
  if (rpId) out.rpId = rpId
  if (Array.isArray(o.allowCredentials) && o.allowCredentials.length > 0) {
    out.allowCredentials = normalizeAllowCredentialsForPlatform(o.allowCredentials)
  }
  return out
}
