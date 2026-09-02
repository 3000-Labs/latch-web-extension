/**
 * @latch/sdk
 * Public dapp-facing extension API — the `window.latch` surface.
 *
 * This is the ONLY interface dapps interact with.
 * It communicates with the content script, which proxies to the background SW.
 *
 * Pattern: mirrors @stellar/freighter-api — a clean public package
 * that hides all internal wallet complexity from dapp developers.
 *
 * ## SEP-0043 interop
 *
 * Latch exposes SEP-0043 methods alongside the Latch-native API:
 *
 * - `getAddress()` → `{ address }` (same GrantAccess flow as `getPublicKey()`)
 * - `signTransaction(xdr, opts?)` → `{ signedTxXdr, signerAddress }` (sign-only in v1)
 * - `getNetworkDetails()` → `{ network: 'TESTNET' | 'PUBLIC', networkPassphrase }`
 *
 * Latch-native methods remain unchanged:
 *
 * - `getPublicKey()` → string
 * - `signTransaction({ xdr, network, accountToSign, submit? })` → object response
 * - `getNetwork()` → `'testnet' | 'mainnet'`
 *
 * **Smart-account addresses:** Latch returns Soroban contract addresses (`C…`), not
 * classic Stellar public keys (`G…`). Pass the same `C…` as `opts.address` when signing.
 *
 * **SEP sign-only v1:** The SEP-shaped `signTransaction(xdr, opts?)` always signs without
 * broadcasting. The dApp submits `signedTxXdr` itself. `submit: true` and `submitUrl` are
 * rejected with SEP error code `-3`.
 *
 * **Errors:** SEP methods throw errors with numeric `code` (`-1`…`-4`). Latch-native methods
 * use string codes (`user_rejected`, etc.).
 */

import type {
  Network,
  OpenSignRequestParams,
  Sep0043GetAddressResponse,
  Sep0043GetNetworkResponse,
  Sep0043SignTransactionOptions,
  Sep0043SignTransactionResponse,
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

  /**
   * Request the user's smart-account address as a plain string.
   * Triggers approval UI if not already permitted.
   *
   * @returns The active smart-account C… address (Soroban contract address).
   */
  getPublicKey(): Promise<string>

  /**
   * Sign a transaction using the Latch-native request object.
   * Accepts `{ xdr, network, accountToSign, submit? }`.
   */
  signTransaction(request: SignTransactionRequest): Promise<SignTransactionResponse>

  /**
   * SEP-0043 `signTransaction(xdr, opts?)`.
   * Signs without broadcasting (v1 sign-only baseline).
   */
  signTransaction(
    xdr: string,
    opts?: Sep0043SignTransactionOptions
  ): Promise<Sep0043SignTransactionResponse>

  /** Open the extension's review flow for an externally prepared signing request */
  openSignRequest(params: OpenSignRequestParams): Promise<void>

  /**
   * Returns the active Latch network as a string.
   * @returns `'testnet'` | `'mainnet'`
   */
  getNetwork(): Promise<Network>

  /**
   * SEP-0043 `getAddress()`.
   * Returns `{ address }` — the active smart-account C… address.
   */
  getAddress(): Promise<Sep0043GetAddressResponse>

  /**
   * SEP-0043 `getNetwork()` object shape.
   * Returns `{ network: 'TESTNET' | 'PUBLIC', networkPassphrase }`.
   */
  getNetworkDetails(): Promise<Sep0043GetNetworkResponse>

  /** Subscribe to active account / network changes */
  on?(event: LatchProviderEventName, handler: (payload: LatchAccountChangedPayload) => void): void

  off?(event: LatchProviderEventName, handler: (payload: LatchAccountChangedPayload) => void): void
}

declare global {
  interface Window {
    latch?: {
      isConnected(): Promise<boolean>
      getPublicKey(): Promise<string>
      signTransaction(
        requestOrXdr: SignTransactionRequest | string,
        opts?: Sep0043SignTransactionOptions
      ): Promise<SignTransactionResponse | Sep0043SignTransactionResponse>
      openSignRequest(params: OpenSignRequestParams): Promise<void>
      getNetwork(): Promise<Network>
      getAddress(): Promise<Sep0043GetAddressResponse>
      getNetworkDetails(): Promise<Sep0043GetNetworkResponse>
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

    async signTransaction(
      requestOrXdr: SignTransactionRequest | string,
      opts?: Sep0043SignTransactionOptions
    ): Promise<SignTransactionResponse | Sep0043SignTransactionResponse> {
      return await requireLatch().signTransaction(
        requestOrXdr as SignTransactionRequest & string,
        opts
      )
    },

    async openSignRequest(params: OpenSignRequestParams) {
      return await requireLatch().openSignRequest(params)
    },

    async getNetwork() {
      return await requireLatch().getNetwork()
    },

    async getAddress() {
      return await requireLatch().getAddress()
    },

    async getNetworkDetails() {
      return await requireLatch().getNetworkDetails()
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

// Re-export SEP-0043 types for dApp convenience
export type {
  Sep0043GetAddressResponse,
  Sep0043GetNetworkResponse,
  Sep0043SignTransactionOptions,
  Sep0043SignTransactionResponse,
  Sep0043Error,
  Sep0043ErrorCode,
} from '@latch/types'
