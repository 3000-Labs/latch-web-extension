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

// ---------------------------------------------------------------------------
// LatchSDK — Latch-native + SEP-0043 adapter
// ---------------------------------------------------------------------------

export interface LatchSDK {
  // ── Latch-native ──────────────────────────────────────────────────────────

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
   * Returns the active Latch network as a string.
   * @returns `'testnet'` | `'mainnet'`
   */
  getNetwork(): Promise<Network>

  /** Subscribe to active account / network changes */
  on?(event: LatchProviderEventName, handler: (payload: LatchAccountChangedPayload) => void): void

  off?(
    event: LatchProviderEventName,
    handler: (payload: LatchAccountChangedPayload) => void
  ): void

  // ── SEP-0043 adapter ──────────────────────────────────────────────────────

  /**
   * SEP-0043 `getAddress()`.
   * Returns `{ address }` — the active smart-account C… address.
   * Uses the same GrantAccess flow as `getPublicKey()`.
   *
   * @throws {Sep0043ProviderError} with code -4 when the user rejects,
   *   -1 when the extension is unavailable.
   *
   * @note Latch returns a Soroban contract address (C…), **not** a classic
   *   Stellar G… address. SEP-0043 dApps that assume a G… address must be
   *   updated to handle C… addresses.
   */
  getAddress(): Promise<Sep0043GetAddressResponse>

  /**
   * SEP-0043 `signTransaction(xdr, opts?)`.
   * Signs a base64-encoded transaction XDR and returns
   * `{ signedTxXdr, signerAddress }`.
   *
   * Parameter mapping:
   * - `opts.networkPassphrase` → Latch `network` (testnet | mainnet)
   * - `opts.address`           → `accountToSign`
   * - `opts.submit`            → `submit` flag (default `false`)
   * - `opts.submitUrl`         → **unsupported in v1**, silently ignored
   *
   * @throws {Sep0043ProviderError} with codes -1…-4.
   */
  signTransactionSep(
    xdr: string,
    opts?: Sep0043SignTransactionOptions
  ): Promise<Sep0043SignTransactionResponse>

  /**
   * SEP-0043 `getNetwork()` — returns the full object shape with
   * `{ network, networkPassphrase }`.
   *
   * The Latch-native `getNetwork()` still returns a plain string.
   * Use this method when you need the SEP-0043 passphrase format.
   *
   * @throws {Sep0043ProviderError} with code -1 on failure.
   */
  getNetworkInfo(): Promise<Sep0043GetNetworkResponse>
}

// ---------------------------------------------------------------------------
// Window augmentation
// ---------------------------------------------------------------------------

declare global {
  interface Window {
    latch?: {
      isConnected(): Promise<boolean>
      getPublicKey(): Promise<string>
      signTransaction(
        requestOrXdr: SignTransactionRequest | string,
        opts?: Sep0043SignTransactionOptions
      ): Promise<SignTransactionResponse | Sep0043SignTransactionResponse>
      getNetwork(): Promise<Network>
      getAddress(): Promise<Sep0043GetAddressResponse>
      getNetworkInfo(): Promise<Sep0043GetNetworkResponse>
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

// ---------------------------------------------------------------------------
// requireLatch helper
// ---------------------------------------------------------------------------

function requireLatch(): NonNullable<Window['latch']> {
  if (typeof window === 'undefined')
    throw new Error('Latch SDK must be used in a browser environment')
  if (!window.latch) throw new Error('Latch extension not detected')
  return window.latch
}

// ---------------------------------------------------------------------------
// getLatchSDK
// ---------------------------------------------------------------------------

export function getLatchSDK(): LatchSDK {
  return {
    // ── Latch-native ────────────────────────────────────────────────────────

    async isConnected() {
      return await requireLatch().isConnected()
    },

    async getPublicKey() {
      return await requireLatch().getPublicKey()
    },

    async signTransaction(request: SignTransactionRequest) {
      return (await requireLatch().signTransaction(request)) as SignTransactionResponse
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

    // ── SEP-0043 adapter ────────────────────────────────────────────────────

    async getAddress() {
      return await requireLatch().getAddress()
    },

    async signTransactionSep(xdr: string, opts?: Sep0043SignTransactionOptions) {
      return (await requireLatch().signTransaction(
        xdr,
        opts
      )) as Sep0043SignTransactionResponse
    },

    async getNetworkInfo() {
      return await requireLatch().getNetworkInfo()
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
} from '@latch/types'
