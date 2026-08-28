/**
 * Page-context provider — sets `window.latch` via a <script> tag injected by provider-bridge.
 * Must not use chrome.* APIs; talks to the isolated bridge via postMessage only.
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

const LATCH_PROVIDER_REQUEST = 'LATCH_PROVIDER_REQUEST'
const LATCH_PROVIDER_RESPONSE = 'LATCH_PROVIDER_RESPONSE'
const LATCH_PROVIDER_EVENT = 'LATCH_PROVIDER_EVENT'
export const LATCH_PROVIDER_MARK = '__latchPostMessageBridge_v1'

// ---------------------------------------------------------------------------
// Stellar network passphrase ↔ Latch Network mapping
// ---------------------------------------------------------------------------
const TESTNET_PASSPHRASE = 'Test SDF Network ; September 2015'
const MAINNET_PASSPHRASE = 'Public Global Stellar Network ; September 2015'

function passphraseToNetwork(passphrase: string | undefined): Network | undefined {
  if (!passphrase) return undefined
  const p = passphrase.trim()
  if (p === TESTNET_PASSPHRASE) return 'testnet'
  if (p === MAINNET_PASSPHRASE) return 'mainnet'
  return undefined
}

function networkToPassphrase(network: Network): string {
  return network === 'mainnet' ? MAINNET_PASSPHRASE : TESTNET_PASSPHRASE
}

// ---------------------------------------------------------------------------
// SEP-0043 error codes
// ---------------------------------------------------------------------------
const SEP_CODE_INTERNAL = -1
const SEP_CODE_EXTERNAL = -2
const SEP_CODE_INVALID = -3
const SEP_CODE_REJECTED = -4

class LatchProviderError extends Error {
  code?: string
  constructor(message: string, code?: string) {
    super(message)
    this.name = 'LatchProviderError'
    this.code = code
  }
}

/**
 * SEP-0043 error — thrown by getAddress(), the SEP-shaped signTransaction(), and
 * the SEP-shaped getNetwork(). `code` is one of -1 … -4.
 */
class Sep0043ProviderError extends Error {
  code: number
  ext?: string[]
  constructor(message: string, code: number, ext?: string[]) {
    super(message)
    this.name = 'Sep0043ProviderError'
    this.code = code
    this.ext = ext
  }
}

/**
 * Map a LatchProviderError (or any caught value) to a SEP-0043 numeric error code.
 *
 * Mapping rules:
 *   - User rejected  → -4
 *   - Bad XDR / mismatch / invalid request → -3
 *   - External / network / API error → -2
 *   - Everything else → -1 (internal)
 */
function toSep0043Error(err: unknown): Sep0043ProviderError {
  const message = err instanceof Error ? err.message : String(err)
  const code = (err instanceof LatchProviderError ? err.code : undefined) ?? ''

  // User rejected
  if (
    code === 'user_rejected' ||
    code === 'rejected' ||
    /reject|denied|cancel/i.test(message)
  ) {
    return new Sep0043ProviderError(message, SEP_CODE_REJECTED)
  }

  // Invalid request (bad XDR, account mismatch, wrong network)
  if (
    code === 'invalid_request' ||
    code === 'bad_xdr' ||
    code === 'account_mismatch' ||
    code === 'wrong_network' ||
    /invalid|mismatch|bad xdr|unknown account|not found/i.test(message)
  ) {
    return new Sep0043ProviderError(message, SEP_CODE_INVALID)
  }

  // External errors (Horizon, RPC, Latch API)
  if (
    code === 'api_error' ||
    code === 'network_error' ||
    code === 'rpc_error' ||
    code === 'horizon_error' ||
    /network|horizon|rpc|api|fetch|http|timeout/i.test(message)
  ) {
    return new Sep0043ProviderError(message, SEP_CODE_EXTERNAL)
  }

  return new Sep0043ProviderError(message, SEP_CODE_INTERNAL)
}

// ---------------------------------------------------------------------------
// postMessage helpers
// ---------------------------------------------------------------------------
type BridgeResponse<T> = {
  source: typeof LATCH_PROVIDER_RESPONSE
  messageId: number
  ok: boolean
  data?: T
  error?: { message: string; code?: string }
}

type ProviderEventName = 'accountChanged' | 'networkChanged'

type ProviderEventPayload = {
  publicKey: string
  network: Network
}

type ProviderEventMessage = {
  source: typeof LATCH_PROVIDER_EVENT
  event: ProviderEventName
  data: ProviderEventPayload
}

type ProviderEventHandler = (payload: ProviderEventPayload) => void

async function sendToBackground<TData>(type: string, payload: unknown): Promise<TData> {
  const messageId = Date.now() + Math.random()

  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      window.removeEventListener('message', onMessage)
      reject(new LatchProviderError('Latch extension timeout', 'timeout'))
    }, 120_000)

    function onMessage(event: MessageEvent) {
      if (event.source !== window) return
      const data = event.data as BridgeResponse<TData>
      if (!data || data.source !== LATCH_PROVIDER_RESPONSE) return
      if (data.messageId !== messageId) return

      window.clearTimeout(timeout)
      window.removeEventListener('message', onMessage)

      if (data.ok) {
        resolve(data.data as TData)
        return
      }
      reject(
        new LatchProviderError(data.error?.message ?? 'Latch request failed', data.error?.code)
      )
    }

    window.addEventListener('message', onMessage, false)
    window.postMessage(
      {
        source: LATCH_PROVIDER_REQUEST,
        messageId,
        type,
        payload,
      },
      window.location.origin
    )
  })
}

async function sendToBackgroundWithTimeout<TData>(
  type: string,
  payload: unknown,
  timeoutMs = 2000
): Promise<TData> {
  return await Promise.race([
    sendToBackground<TData>(type, payload),
    new Promise<TData>((_, reject) => {
      window.setTimeout(
        () => reject(new LatchProviderError('Latch extension timeout', 'timeout')),
        timeoutMs
      )
    }),
  ])
}

// ---------------------------------------------------------------------------
// Provider interface — Latch-native + SEP-0043 methods coexist
// ---------------------------------------------------------------------------
interface LatchProvider {
  // ── Latch-native API (stable, never removed) ──────────────────────────────

  /** Returns true when the extension is reachable. */
  isConnected(): Promise<boolean>

  /**
   * Request the active smart-account address as a string.
   * Triggers GrantAccess approval if the origin has not been permitted yet.
   *
   * @returns The active smart-account C… address (Soroban contract address).
   */
  getPublicKey(): Promise<string>

  /**
   * Sign a transaction using the Latch-native request shape.
   * Existing dApps that call this form are not affected.
   */
  signTransaction(request: SignTransactionRequest): Promise<SignTransactionResponse>

  /**
   * Returns the active network as a string ('testnet' | 'mainnet').
   * Latch-native return shape — unchanged.
   */
  getNetwork(): Promise<Network>

  /** Open an external sign request (dApp-initiated sign overlay). */
  openSignRequest(params: OpenSignRequestParams): Promise<void>

  on(event: ProviderEventName, handler: ProviderEventHandler): void
  off(event: ProviderEventName, handler: ProviderEventHandler): void

  // ── SEP-0043 adapter methods ──────────────────────────────────────────────

  /**
   * SEP-0043 `getAddress()`.
   * Returns `{ address }` where `address` is the active smart-account C… address.
   * Uses the same GrantAccess flow as `getPublicKey()`.
   *
   * @throws {Sep0043ProviderError} with code -4 when the user rejects,
   *   -1 when the extension is unavailable.
   */
  getAddress(): Promise<Sep0043GetAddressResponse>

  /**
   * SEP-0043 `signTransaction(xdr, opts?)`.
   * Signs a base64-encoded transaction XDR.
   *
   * Parameter mapping:
   *   - `opts.networkPassphrase` → `network` (testnet | mainnet)
   *   - `opts.address`           → `accountToSign`
   *   - `opts.submit`            → `submit` (default: false in SEP baseline)
   *
   * `opts.submitUrl` is accepted but not supported in v1; pass it to the
   * background as documentation only (it will be ignored).
   *
   * @returns `{ signedTxXdr, signerAddress }`.
   * @throws {Sep0043ProviderError} with codes -1…-4 (see SEP-0043 spec).
   */
  signTransaction(xdr: string, opts?: Sep0043SignTransactionOptions): Promise<Sep0043SignTransactionResponse>

  /**
   * SEP-0043 `getNetwork()` — object shape.
   * Returns `{ network, networkPassphrase }`.
   * The Latch-native string overload is unchanged on `getNetwork()` itself;
   * use this method when you need the SEP passphrase format.
   *
   * @throws {Sep0043ProviderError} with code -1 on failure.
   */
  getNetworkInfo(): Promise<Sep0043GetNetworkResponse>

  [LATCH_PROVIDER_MARK]?: true
}

// ---------------------------------------------------------------------------
// installLatch
// ---------------------------------------------------------------------------
function installLatch() {
  const w = window as Window & { latch?: LatchProvider }
  if (w.latch?.[LATCH_PROVIDER_MARK]) return

  const emitter = new EventTarget()
  const handlerMap = new WeakMap<ProviderEventHandler, EventListener>()

  window.addEventListener('message', (event: MessageEvent) => {
    if (event.source !== window) return
    const data = event.data as ProviderEventMessage
    if (!data || data.source !== LATCH_PROVIDER_EVENT) return
    if (data.event !== 'accountChanged' && data.event !== 'networkChanged') return
    if (!data.data?.publicKey) return
    emitter.dispatchEvent(
      new CustomEvent(data.event, {
        detail: {
          publicKey: data.data.publicKey,
          network: data.data.network,
        } satisfies ProviderEventPayload,
      })
    )
  })

  const latch: LatchProvider = {
    [LATCH_PROVIDER_MARK]: true,

    // ── Latch-native ────────────────────────────────────────────────────────

    async isConnected() {
      try {
        await sendToBackgroundWithTimeout('PING_EXTENSION', {})
        return true
      } catch {
        return false
      }
    },

    async getPublicKey() {
      const data = await sendToBackground<{ publicKey: string }>('DAPP_GET_PUBLIC_KEY', {
        origin: window.location.origin,
      })
      return data.publicKey
    },

    // Overloaded: accepts both Latch-native object AND SEP-0043 (xdr, opts?)
    async signTransaction(
      requestOrXdr: SignTransactionRequest | string,
      opts?: Sep0043SignTransactionOptions
    ): Promise<SignTransactionResponse | Sep0043SignTransactionResponse> {
      if (typeof requestOrXdr === 'string') {
        // ── SEP-0043 path ──────────────────────────────────────────────────
        const xdr = requestOrXdr
        try {
          // Resolve network from passphrase; fall back to active network
          let network: Network | undefined = passphraseToNetwork(opts?.networkPassphrase)
          if (!network) {
            try {
              const netData = await sendToBackground<{ network: Network }>(
                'GET_ACTIVE_NETWORK',
                {}
              )
              network = netData.network
            } catch {
              network = 'testnet'
            }
          }

          const nativeRequest: SignTransactionRequest = {
            xdr,
            network,
            accountToSign: opts?.address ?? '',
            submit: opts?.submit ?? false,
          }

          const data = await sendToBackground<{ response: SignTransactionResponse }>(
            'DAPP_SIGN_TRANSACTION',
            {
              origin: window.location.origin,
              request: nativeRequest,
            }
          )

          const resp = data.response
          // SEP-0043 requires signedTxXdr; fall back gracefully to signedXdr
          const signedTxXdr = resp.signedTxXdr ?? resp.signedXdr ?? ''
          const signerAddress = nativeRequest.accountToSign || ''

          return { signedTxXdr, signerAddress } satisfies Sep0043SignTransactionResponse
        } catch (err) {
          throw toSep0043Error(err)
        }
      }

      // ── Latch-native path (object form) ────────────────────────────────
      const data = await sendToBackground<{ response: SignTransactionResponse }>(
        'DAPP_SIGN_TRANSACTION',
        {
          origin: window.location.origin,
          request: requestOrXdr,
        }
      )
      return data.response
    },

    async getNetwork() {
      const data = await sendToBackground<{ network: Network }>('GET_ACTIVE_NETWORK', {})
      return data.network
    },

    async openSignRequest(params: OpenSignRequestParams) {
      await sendToBackground('DAPP_OPEN_SIGN_REQUEST', {
        origin: window.location.origin,
        request: {
          network: params.network,
          smartAccountAddress: params.account,
          unsignedTxXdr: params.xdr,
          payloadRef: params.payloadRef,
          callback: params.callback,
          requestId: params.requestId,
          submit: params.submit,
          origin: params.origin ?? window.location.origin,
        },
      })
    },

    on(event, handler) {
      const listener: EventListener = (ev) => {
        const detail = (ev as CustomEvent<ProviderEventPayload>).detail
        handler(detail)
      }
      handlerMap.set(handler, listener)
      emitter.addEventListener(event, listener)
    },

    off(event, handler) {
      const listener = handlerMap.get(handler)
      if (!listener) return
      emitter.removeEventListener(event, listener)
      handlerMap.delete(handler)
    },

    // ── SEP-0043 adapter ─────────────────────────────────────────────────

    async getAddress() {
      try {
        const data = await sendToBackground<{ publicKey: string }>('DAPP_GET_PUBLIC_KEY', {
          origin: window.location.origin,
        })
        return { address: data.publicKey } satisfies Sep0043GetAddressResponse
      } catch (err) {
        throw toSep0043Error(err)
      }
    },

    async getNetworkInfo() {
      try {
        const data = await sendToBackground<{ network: Network }>('GET_ACTIVE_NETWORK', {})
        return {
          network: data.network === 'mainnet' ? 'Public Global Stellar Network ; September 2015' : 'Test SDF Network ; September 2015',
          networkPassphrase: networkToPassphrase(data.network),
        } satisfies Sep0043GetNetworkResponse
      } catch (err) {
        throw toSep0043Error(err)
      }
    },
  }

  w.latch = latch
}

installLatch()
