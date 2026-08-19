/**
 * Page-context provider — sets `window.latch` via a <script> tag injected by provider-bridge.
 * Must not use chrome.* APIs; talks to the isolated bridge via postMessage only.
 */

import type {
  Network,
  OpenSignRequestParams,
  SignTransactionRequest,
  SignTransactionResponse,
} from '@latch/types'

const LATCH_PROVIDER_REQUEST = 'LATCH_PROVIDER_REQUEST'
const LATCH_PROVIDER_RESPONSE = 'LATCH_PROVIDER_RESPONSE'
const LATCH_PROVIDER_EVENT = 'LATCH_PROVIDER_EVENT'
export const LATCH_PROVIDER_MARK = '__latchPostMessageBridge_v1'

class LatchProviderError extends Error {
  code?: string
  constructor(message: string, code?: string) {
    super(message)
    this.name = 'LatchProviderError'
    this.code = code
  }
}

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

interface LatchProvider {
  isConnected(): Promise<boolean>
  getPublicKey(): Promise<string>
  getNetwork(): Promise<Network>
  signTransaction(request: SignTransactionRequest): Promise<SignTransactionResponse>
  openSignRequest(params: OpenSignRequestParams): Promise<void>
  on(event: ProviderEventName, handler: ProviderEventHandler): void
  off(event: ProviderEventName, handler: ProviderEventHandler): void
  [LATCH_PROVIDER_MARK]?: true
}

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
    async signTransaction(request: SignTransactionRequest) {
      const data = await sendToBackground<{ response: SignTransactionResponse }>(
        'DAPP_SIGN_TRANSACTION',
        {
          origin: window.location.origin,
          request,
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
  }

  w.latch = latch
}

installLatch()
