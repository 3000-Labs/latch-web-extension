import { mnemonicToSeedSync, validateMnemonic } from '@scure/bip39'
import { wordlist } from '@scure/bip39/wordlists/english.js'
import { Keypair } from '@stellar/stellar-sdk'
import { derivePath } from 'ed25519-hd-key'

const ALLOWED_WORD_COUNTS = new Set([12, 15, 18, 21, 24])

export class MnemonicValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'MnemonicValidationError'
  }
}

function bytesToHex(bytes: Uint8Array): string {
  let out = ''
  for (let i = 0; i < bytes.length; i++) {
    out += bytes[i]!.toString(16).padStart(2, '0')
  }
  return out
}

/** Best-effort zeroization of byte arrays holding sensitive material. */
export function zeroizeBytes(...bufs: (Uint8Array | undefined)[]) {
  for (const b of bufs) {
    if (b) b.fill(0)
  }
}

/**
 * Trim, collapse whitespace, single-space join, lowercase (BIP-39 English checksum is case-insensitive).
 */
export function normalizeMnemonicPhrase(input: string): string {
  const words = input
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0)
    .map((w) => w.toLowerCase())
  return words.join(' ')
}

/**
 * Validates word count (12/15/18/21/24) and BIP-39 checksum. Does not log mnemonic.
 */
export function assertValidMnemonicPhrase(normalized: string): void {
  const n = normalized.split(' ').length
  if (!ALLOWED_WORD_COUNTS.has(n)) {
    throw new MnemonicValidationError('Mnemonic must be 12, 15, 18, 21, or 24 words.')
  }
  if (!validateMnemonic(normalized, wordlist)) {
    throw new MnemonicValidationError('Invalid mnemonic (checksum failed or unknown words).')
  }
}

const STELLAR_SLIP10_PATH = "m/44'/148'/0'"

/**
 * Derives a Stellar keypair from BIP-39 mnemonic + optional BIP-39 passphrase at SLIP-0010 path m/44'/148'/0'.
 * Caller must clear returned key material when done (Keypair holds secret internally; avoid persisting).
 */
export function deriveStellarKeypairFromMnemonic(
  mnemonic: string,
  bip39Passphrase: string | undefined
): { keypair: Keypair; gAddress: string } {
  const normalized = normalizeMnemonicPhrase(mnemonic)
  assertValidMnemonicPhrase(normalized)

  const seed = mnemonicToSeedSync(normalized, bip39Passphrase ?? '')
  let derivedKey: Uint8Array | undefined
  try {
    const seedHex = bytesToHex(seed)
    const { key } = derivePath(STELLAR_SLIP10_PATH, seedHex)
    derivedKey = new Uint8Array(key)
    const keypair = Keypair.fromRawEd25519Seed(derivedKey)
    const gAddress = keypair.publicKey()
    return { keypair, gAddress }
  } finally {
    zeroizeBytes(seed, derivedKey)
  }
}
