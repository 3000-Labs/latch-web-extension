import type { StoredAccount } from '@latch/types'
import { StrKey } from '@stellar/stellar-sdk'

import { fromHex } from './crypto'

/** WebAuthn: 65-byte uncompressed P-256 from keyDataHex. */
export function webauthnSignerPublicKeyBytes(keyDataHex: string): Uint8Array {
  const hex = keyDataHex.trim().replace(/^0x/i, '')
  if (hex.length < 130) throw new Error('keyDataHex too short for WebAuthn signer')
  return fromHex(hex.slice(0, 130))
}

/** Ed25519: 32-byte raw pubkey hex. */
export function ed25519SignerPublicKeyBytes(publicKeyHex: string): Uint8Array {
  const hex = publicKeyHex.trim().replace(/^0x/i, '')
  if (hex.length !== 64) throw new Error('expected 32-byte ed25519 pubkey hex')
  return fromHex(hex)
}

/**
 * Resolve on-chain signer public key bytes for blind-id derivation.
 * Delegated G-address uses 32-byte ed25519 pubkey when available on account.
 */
export async function signerPublicKeyBytesForAccount(
  account: StoredAccount
): Promise<Uint8Array> {
  if (account.passkeyKeyDataHex?.trim()) {
    return webauthnSignerPublicKeyBytes(account.passkeyKeyDataHex)
  }
  if (account.phantomPublicKeyHex?.trim()) {
    return ed25519SignerPublicKeyBytes(account.phantomPublicKeyHex)
  }
  if (account.gAddress?.trim()) {
    const raw = StrKey.decodeEd25519PublicKey(account.gAddress)
    return new Uint8Array(raw)
  }
  throw new Error('No signer public key material on account')
}
