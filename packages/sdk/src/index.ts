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

import type {
  Network,
  OpenSignRequestParams,
  SignTransactionRequest,
  SignTransactionResponse,
} from '@latch/types'

export type LatchAccountChangedPayload = {
  publicKey: string
  network: Network
}

export type LatchProviderEventName = 'accountChanged' | 'networkChanged'

export interface LatchSDK {
  /** Returns true if the Latch extension is installed and accessible */
  isConnected(): Promise<boolean>

  /** Request the user's public key — triggers approval UI if not already permitted */
  getPublicKey(): Promise<string>

  /** Request the user to sign an XDR-encoded transaction */
  signTransaction(request: SignTransactionRequest): Promise<SignTransactionResponse>

  /** Open the extension's review flow for an externally prepared signing request */
  openSignRequest(params: OpenSignRequestParams): Promise<void>

  /** Returns the active network */
  getNetwork(): Promise<Network>

  /** Subscribe to active account / network changes */
  on?(event: LatchProviderEventName, handler: (payload: LatchAccountChangedPayload) => void): void

  off?(event: LatchProviderEventName, handler: (payload: LatchAccountChangedPayload) => void): void
}

declare global {
  interface Window {
    latch?: {
      isConnected(): Promise<boolean>
      getPublicKey(): Promise<string>
      signTransaction(request: SignTransactionRequest): Promise<SignTransactionResponse>
      openSignRequest(params: OpenSignRequestParams): Promise<void>
      getNetwork(): Promise<Network>
      on?(
        event: LatchProviderEventName,
        handler: (payload: LatchAccountChangedPayload) => void
      ): void
      off?(
        event: LatchProviderEventName,
        handler: (payload: LatchAccountChangedPayload) => void
      ): void
    }
  }
}

function requireLatch(): NonNullable<Window['latch']> {
  if (typeof window === 'undefined')
    throw new Error('Latch SDK must be used in a browser environment')
  if (!window.latch) throw new Error('Latch extension not detected')
  return window.latch
}

export function getLatchSDK(): LatchSDK {
  return {
    async isConnected() {
      return await requireLatch().isConnected()
    },
    async getPublicKey() {
      return await requireLatch().getPublicKey()
    },
    async signTransaction(request: SignTransactionRequest) {
      return await requireLatch().signTransaction(request)
    },
    async openSignRequest(params: OpenSignRequestParams) {
      return await requireLatch().openSignRequest(params)
    },
    async getNetwork() {
      return await requireLatch().getNetwork()
    },
    on(event, handler) {
      requireLatch().on?.(event, handler)
    },
    off(event, handler) {
      requireLatch().off?.(event, handler)
    },
  }
}

export default getLatchSDK
