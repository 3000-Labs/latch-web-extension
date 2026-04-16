/**
 * @latch/types
 * Shared TypeScript types across all packages and apps.
 * No runtime code — types only.
 */

export type Network = 'testnet' | 'mainnet'

export interface LatchAccount {
  /** Stellar G-address (public key) */
  publicKey: string
  /** C-address if this is a Soroban smart account contract */
  contractAddress?: string
  network: Network
}

export interface SignTransactionRequest {
  xdr: string
  network: Network
  accountToSign: string
}

export interface SignTransactionResponse {
  signedXdr: string
}

// Message types for popup ↔ background communication
export type MessageType =
  | 'SIGN_TRANSACTION'
  | 'GET_PUBLIC_KEY'
  | 'UNLOCK_VAULT'
  | 'LOCK_VAULT'

export interface BackgroundMessage<T = unknown> {
  type: MessageType
  payload: T
}

export interface BackgroundResponse<T = unknown> {
  ok: boolean
  data?: T
  error?: string
}
