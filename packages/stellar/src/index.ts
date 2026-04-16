/**
 * @latch/stellar
 * Stellar/Soroban client logic — network calls, XDR helpers, transaction lifecycle.
 * No key material here. Signing happens in the background service worker only.
 */

export type { Network } from '@latch/types'

// TODO: simulate transaction (Soroban RPC simulateTransaction)
// TODO: submit transaction (Horizon submitTransaction)
// TODO: poll transaction status
// TODO: XDR / ScVal helpers
