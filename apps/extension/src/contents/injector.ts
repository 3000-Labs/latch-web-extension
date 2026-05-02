/**
 * Content Script — latch provider
 *
 * Runs at document_start and exposes `window.latch` for dapps.
 * All requests are forwarded to the background SW via chrome.runtime.sendMessage.
 * No key material ever touches this file.
 */

import type { PlasmoCSConfig } from 'plasmo'

export const config: PlasmoCSConfig = {
  matches: ['<all_urls>'],
  run_at: 'document_start',
  world: 'MAIN',
}

type BgRes<T> = { ok: boolean; data?: T; error?: { message: string } }

function assertOk<T>(res: BgRes<T>): T {
  if (res?.ok) return res.data as T
  throw new Error(res?.error?.message ?? 'Latch request failed')
}

async function sendToBackground<TData>(type: string, payload: unknown): Promise<TData> {
  const res = (await chrome.runtime.sendMessage({ type, payload })) as BgRes<TData>
  return assertOk(res)
}

function installLatch() {
  const w = window as any
  if (w.latch) return

  w.latch = {
    async isConnected() {
      return true
    },
    async getPublicKey() {
      const data = await sendToBackground<{ publicKey: string }>('DAPP_GET_PUBLIC_KEY', {
        origin: window.location.origin,
      })
      return data.publicKey
    },
    async signTransaction(request: any) {
      const data = await sendToBackground<{ response: { signedXdr: string } }>('DAPP_SIGN_TRANSACTION', {
        origin: window.location.origin,
        request,
      })
      return data.response
    },
    async getNetwork() {
      return 'testnet'
    },
  }
}

installLatch()
