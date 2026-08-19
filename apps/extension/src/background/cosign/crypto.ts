/**
 * Cosign blind-index crypto — byte-for-byte per references/multisig-cosign-flow 2.md §1.
 */

const HKDF_INFO = new TextEncoder().encode('latch-wck-bundle-v1')

function asBufferSource(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength)
  copy.set(bytes)
  return copy.buffer
}

export function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

export function fromHex(hex: string): Uint8Array {
  const normalized = hex.trim().toLowerCase()
  if (normalized.length % 2 !== 0) throw new Error('invalid hex length')
  const out = new Uint8Array(normalized.length / 2)
  for (let i = 0; i < out.length; i++) {
    out[i] = Number.parseInt(normalized.slice(i * 2, i * 2 + 2), 16)
  }
  return out
}

export function toBase64(bytes: Uint8Array): string {
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary)
}

export function fromBase64(b64: string): Uint8Array {
  const binary = atob(b64)
  const out = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i)
  return out
}

export function generateWCK(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(32))
}

async function hmacSha256Hex(keyBytes: Uint8Array, msg: Uint8Array): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    asBufferSource(keyBytes),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, asBufferSource(msg))
  return toHex(new Uint8Array(sig))
}

async function sha256Hex(msg: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', asBufferSource(msg))
  return toHex(new Uint8Array(digest))
}

export function deriveQueueIndex(wck: Uint8Array, walletCAddress: string): Promise<string> {
  return hmacSha256Hex(wck, new TextEncoder().encode(walletCAddress))
}

export function deriveBlindSignerId(
  wck: Uint8Array,
  signerPublicKeyBytes: Uint8Array
): Promise<string> {
  return hmacSha256Hex(wck, signerPublicKeyBytes)
}

export function deriveMemberBlindId(signerPublicKeyBytes: Uint8Array): Promise<string> {
  return sha256Hex(signerPublicKeyBytes)
}

export function derivePickupKey(walletCAddress: string): Promise<string> {
  return sha256Hex(new TextEncoder().encode(walletCAddress))
}

export function generateDeviceTransportKeyPair(): Promise<CryptoKeyPair> {
  return crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, [
    'deriveKey',
    'deriveBits',
  ])
}

export async function exportRawPublicKey(pub: CryptoKey): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.exportKey('raw', pub))
}

async function ecdhDeriveAesKey(
  privateKey: CryptoKey,
  publicKey: CryptoKey,
  salt: Uint8Array
): Promise<CryptoKey> {
  const sharedSecretBits = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: publicKey },
    privateKey,
    256
  )
  const hkdfKey = await crypto.subtle.importKey('raw', sharedSecretBits, 'HKDF', false, [
    'deriveKey',
  ])
  return crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt, info: HKDF_INFO },
    hkdfKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

export interface SealedBundle {
  v: 1
  ephemeralPubKey: string
  salt: string
  iv: string
  ciphertext: string
}

export async function sealWCKBundle(
  wck: Uint8Array,
  recipientRawPublicKey: Uint8Array
): Promise<string> {
  const ephemeral = await generateDeviceTransportKeyPair()
  const recipientKey = await crypto.subtle.importKey(
    'raw',
    asBufferSource(recipientRawPublicKey),
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    []
  )
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const aesKey = await ecdhDeriveAesKey(ephemeral.privateKey, recipientKey, salt)
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, aesKey, asBufferSource(wck))
  )

  const bundle: SealedBundle = {
    v: 1,
    ephemeralPubKey: toBase64(await exportRawPublicKey(ephemeral.publicKey)),
    salt: toBase64(salt),
    iv: toBase64(iv),
    ciphertext: toBase64(ciphertext),
  }
  return JSON.stringify(bundle)
}

export async function unsealWCKBundle(
  bundleJson: string,
  recipientPrivateKey: CryptoKey
): Promise<Uint8Array> {
  const bundle = JSON.parse(bundleJson) as SealedBundle
  if (bundle.v !== 1) throw new Error(`unsupported WCK bundle version: ${bundle.v}`)

  const ephemeralPub = await crypto.subtle.importKey(
    'raw',
    asBufferSource(fromBase64(bundle.ephemeralPubKey)),
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    []
  )
  const aesKey = await ecdhDeriveAesKey(
    recipientPrivateKey,
    ephemeralPub,
    fromBase64(bundle.salt)
  )
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromBase64(bundle.iv) },
    aesKey,
    asBufferSource(fromBase64(bundle.ciphertext))
  )
  return new Uint8Array(plaintext)
}
