import { Address, scValToNative, xdr } from '@stellar/stellar-sdk'

/**
 * Latch `submit-delegated` expects `signedAuthEntryBase64` to be base64 of the raw
 * 64-byte Ed25519 signature. Wallets return a signed SorobanAuthorizationEntry XDR;
 * extract the signature bytes before submit.
 *
 * Freighter must sign `gAddressEntryTemplateXdr` (not `gAddressPreimageXdr`).
 */
export function normalizeDelegatedSignatureBase64(signedAuthEntryBase64: unknown): string {
  const b64 = coerceBase64String(signedAuthEntryBase64)
  const raw = Buffer.from(b64, 'base64')
  if (raw.length === 64) {
    return b64
  }
  return extractEd25519SignatureBase64FromSignedAuthEntry(b64)
}

function coerceBase64String(value: unknown): string {
  if (typeof value === 'string') return value
  if (value == null) {
    throw new Error('Missing signed auth entry from wallet')
  }
  if (Buffer.isBuffer(value) || value instanceof Uint8Array) {
    return Buffer.from(value).toString('base64')
  }
  if (isSerializedBuffer(value)) {
    return Buffer.from(value.data).toString('base64')
  }
  throw new Error(`Expected base64 string from wallet, got ${typeof value}`)
}

function isSerializedBuffer(value: object): value is { type: 'Buffer'; data: number[] } {
  return (
    'type' in value &&
    (value as { type: unknown }).type === 'Buffer' &&
    'data' in value &&
    Array.isArray((value as { data: unknown }).data)
  )
}

function coerceByteArray(value: unknown): Buffer {
  if (Buffer.isBuffer(value)) return value
  if (value instanceof Uint8Array) return Buffer.from(value)
  if (typeof value === 'string') return Buffer.from(value, 'base64')
  if (value != null && typeof value === 'object' && isSerializedBuffer(value)) {
    return Buffer.from(value.data)
  }
  throw new Error(`Cannot read signature bytes (got ${typeof value})`)
}

function extractSignatureFromScValNative(native: unknown): Buffer | null {
  const entries = Array.isArray(native) ? native : [native]
  for (const entry of entries) {
    if (entry && typeof entry === 'object') {
      const rec = entry as Record<string, unknown>
      if ('signature' in rec) {
        const buf = coerceByteArray(rec.signature)
        if (buf.length === 64) return buf
      }
    }
  }
  return null
}

function readEd25519SignatureBytes(creds: xdr.SorobanAddressCredentials): Buffer {
  const raw = creds.signature()
  if (raw == null) {
    throw new Error(
      'Signed auth entry has no signature. Freighter must sign gAddressEntryTemplateXdr.'
    )
  }

  if (Buffer.isBuffer(raw) || raw instanceof Uint8Array) {
    const buf = coerceByteArray(raw)
    if (buf.length === 64) return buf
    throw new Error(`Expected 64-byte signature inside auth entry, got ${buf.length} bytes`)
  }

  try {
    const native = scValToNative(raw as xdr.ScVal)
    const extracted = extractSignatureFromScValNative(native)
    if (extracted) return extracted
  } catch {
    // fall through
  }

  throw new Error('Could not read Ed25519 signature from signed auth entry')
}

function extractEd25519SignatureBase64FromSignedAuthEntry(signedAuthEntryBase64: string): string {
  const entry = xdr.SorobanAuthorizationEntry.fromXDR(signedAuthEntryBase64, 'base64')
  const credType = entry.credentials().switch()
  if (credType !== xdr.SorobanCredentialsType.sorobanCredentialsAddress()) {
    throw new Error(`Expected address credentials, got ${credType.name}`)
  }
  return readEd25519SignatureBytes(entry.credentials().address()).toString('base64')
}

/** G-address on a native delegated Soroban auth entry, when credentials are address-type. */
export function authEntrySignerPublicKey(entryXdrBase64: string): string | null {
  try {
    const entry = xdr.SorobanAuthorizationEntry.fromXDR(entryXdrBase64, 'base64')
    const creds = entry.credentials()
    if (creds.switch() !== xdr.SorobanCredentialsType.sorobanCredentialsAddress()) {
      return null
    }
    const addr = creds.address().address()
    if (addr.switch() === xdr.ScAddressType.scAddressTypeAccount()) {
      return Address.fromScAddress(addr).toString()
    }
  } catch {
    // ignore parse errors
  }
  return null
}

/**
 * Pick the delegated auth entry template the user must sign.
 * Swaps may include multiple delegated rows (user G + bundler G); always match `signerG`.
 */
export function resolveDelegatedAuthEntryForSigner(args: {
  authEntriesXdr?: string[]
  delegatedNativeAuthEntryIndices?: number[]
  gAddressEntryTemplateXdr?: string
  signerG: string
}): { templateXdr: string; entryIndex: number } | null {
  const signer = args.signerG.trim()
  if (!signer) return null

  const candidateIndices: number[] = []
  for (const idx of args.delegatedNativeAuthEntryIndices ?? []) {
    if (!candidateIndices.includes(idx)) candidateIndices.push(idx)
  }
  for (let i = 0; i < (args.authEntriesXdr?.length ?? 0); i++) {
    if (!candidateIndices.includes(i)) candidateIndices.push(i)
  }

  for (const idx of candidateIndices) {
    const entryXdr = args.authEntriesXdr?.[idx]
    if (!entryXdr) continue
    if (authEntrySignerPublicKey(entryXdr) === signer) {
      return { templateXdr: entryXdr, entryIndex: idx }
    }
  }

  const explicit = args.gAddressEntryTemplateXdr
  if (explicit) {
    const pk = authEntrySignerPublicKey(explicit)
    if (!pk || pk === signer) {
      const idx = args.delegatedNativeAuthEntryIndices?.[0] ?? 0
      return { templateXdr: explicit, entryIndex: idx }
    }
  }

  return null
}
