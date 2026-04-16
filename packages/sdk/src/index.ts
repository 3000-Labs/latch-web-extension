/**
 * @latch/sdk
 * Public dapp-facing extension API — the `window.latch` surface.
 *
 * This is the ONLY interface dapps interact with.
 * It communicates with the content script, which proxies to the background SW.
 *
 * Pattern: mirrors @stellar/freighter-api — a clean public package
 * that hides all internal wallet complexity from dapp developers.
 */

import type { Network, SignTransactionRequest, SignTransactionResponse } from '@latch/types'

export interface LatchSDK {
  /** Returns true if the Latch extension is installed and accessible */
  isConnected(): Promise<boolean>

  /** Request the user's public key — triggers approval UI if not already permitted */
  getPublicKey(): Promise<string>

  /** Request the user to sign an XDR-encoded transaction */
  signTransaction(request: SignTransactionRequest): Promise<SignTransactionResponse>

  /** Returns the active network */
  getNetwork(): Promise<Network>
}

// TODO: implement LatchSDK using window.postMessage ↔ content script bridge
