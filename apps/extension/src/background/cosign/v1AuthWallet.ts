import type { StoredAccount } from '@latch/types'

export type V1AuthKeyType = 'passkey' | 'ed25519'

/** Resolve `/v1/auth/*` wallet + key_type for a linked signing account. */
export function v1AuthWalletForLinkedAccount(linked: StoredAccount): {
  wallet: string
  keyType: V1AuthKeyType
} {
  if (linked.mode === 'passkey') {
    const wallet = linked.smartAccountAddress?.trim()
    if (!wallet) throw new Error('Passkey account missing smart account address')
    return { wallet, keyType: 'passkey' }
  }

  if (linked.mode === 'mnemonic') {
    const wallet = linked.gAddress?.trim()
    if (!wallet) throw new Error('Delegated account missing G address for V1 auth')
    return { wallet, keyType: 'ed25519' }
  }

  throw new Error(`Account mode "${linked.mode}" cannot authenticate for cosign V1`)
}
