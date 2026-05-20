import '../style.css'

import { useEffect, useState } from 'react'
import { startAuthentication, startRegistration } from '@simplewebauthn/browser'

import { formatWebauthnBrowserError } from '../ui/webauthn/passkey'
import {
  LATCH_PASSKEY_BRIDGE_RESULT,
  passkeyBridgeStorageKey,
  type PasskeyBridgeStoredPayload,
} from '../ui/webauthn/passkeyBridge'

export default function PasskeyBridgeTab() {
  const [status, setStatus] = useState('Opening passkey…')

  useEffect(() => {
    const raw = window.location.hash.replace(/^#/, '')
    const ticket = raw ? decodeURIComponent(raw) : ''
    if (!ticket) {
      setStatus('Missing session. Close this window and try again from Latch.')
      return
    }

    void (async () => {
      const key = passkeyBridgeStorageKey(ticket)
      const bag = await chrome.storage.session.get(key)
      const payload = bag[key] as PasskeyBridgeStoredPayload | undefined
      if (!payload) {
        setStatus('This passkey session expired. Close the window and try again.')
        return
      }
      await chrome.storage.session.remove(key)

      setStatus('Complete the passkey prompt from your system…')
      try {
        let response: unknown
        if (payload.mode === 'registration') {
          response = await startRegistration({
            optionsJSON: payload.optionsJSON,
          } as Parameters<typeof startRegistration>[0])
        } else {
          response = await startAuthentication({
            optionsJSON: payload.optionsJSON,
          } as Parameters<typeof startAuthentication>[0])
        }
        await chrome.runtime.sendMessage({
          type: LATCH_PASSKEY_BRIDGE_RESULT,
          ticket,
          ok: true,
          response,
        })
        window.close()
      } catch (e) {
        const msg = formatWebauthnBrowserError(e)
        await chrome.runtime.sendMessage({
          type: LATCH_PASSKEY_BRIDGE_RESULT,
          ticket,
          ok: false,
          error: msg,
        })
        window.close()
      }
    })()
  }, [])

  return (
    <div className="bg-bg px-5 py-6 text-fg">
      <p className="text-center text-sm font-bold text-muted">{status}</p>
    </div>
  )
}
