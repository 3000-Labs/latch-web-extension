/**
 * Chrome often does not complete WebAuthn (navigator.credentials) in the extension side panel
 * (the promise can hang with no system UI). We run the ceremony in a small extension popup window
 * instead; popup surface keeps in-page WebAuthn.
 */

export const LATCH_PASSKEY_BRIDGE_RESULT = "LATCH_PASSKEY_BRIDGE_RESULT" as const

const REQ_PREFIX = "latchPasskeyBridgeReq:"

export function passkeyBridgeStorageKey(ticket: string): string {
  return `${REQ_PREFIX}${ticket}`
}

export type PasskeyBridgeStoredPayload = {
  mode: "registration" | "authentication"
  optionsJSON: unknown
  createdAt: number
}

export async function openPasskeyBridgeAndWait(args: {
  mode: "registration" | "authentication"
  optionsJSON: unknown
  timeoutMs?: number
}): Promise<unknown> {
  if (typeof chrome === "undefined" || !chrome.windows?.create || !chrome.storage?.session) {
    throw new Error("Passkey bridge requires Chrome extension APIs.")
  }

  const ticket = crypto.randomUUID()
  const key = passkeyBridgeStorageKey(ticket)

  try {
    JSON.stringify(args.optionsJSON)
  } catch {
    throw new Error("Passkey options are not serializable for the bridge window.")
  }

  const payload: PasskeyBridgeStoredPayload = {
    mode: args.mode,
    optionsJSON: args.optionsJSON,
    createdAt: Date.now(),
  }

  const url = chrome.runtime.getURL(`tabs/passkey-bridge.html#${encodeURIComponent(ticket)}`)
  const timeoutMs = args.timeoutMs ?? 120_000

  return await new Promise((resolve, reject) => {
    const to = window.setTimeout(() => {
      chrome.runtime.onMessage.removeListener(onMsg)
      void chrome.storage.session.remove(key)
      reject(new Error("Passkey prompt timed out."))
    }, timeoutMs)

    const onMsg = (message: unknown) => {
      const m = message as {
        type?: string
        ticket?: string
        ok?: boolean
        response?: unknown
        error?: string
      }
      if (m?.type !== LATCH_PASSKEY_BRIDGE_RESULT || m.ticket !== ticket) {
        return
      }
      window.clearTimeout(to)
      chrome.runtime.onMessage.removeListener(onMsg)
      void chrome.storage.session.remove(key).catch(() => {})
      if (m.ok && m.response !== undefined) resolve(m.response)
      else reject(new Error(m.error ?? "Passkey was cancelled or failed."))
    }

    chrome.runtime.onMessage.addListener(onMsg)

    chrome.storage.session.set({ [key]: payload }, () => {
      const last = chrome.runtime.lastError
      if (last) {
        window.clearTimeout(to)
        chrome.runtime.onMessage.removeListener(onMsg)
        reject(new Error(last.message))
        return
      }
      chrome.windows.create(
        {
          url,
          type: "popup",
          width: 440,
          height: 580,
          focused: true,
        },
        () => {
          const wErr = chrome.runtime.lastError
          if (wErr) {
            window.clearTimeout(to)
            chrome.runtime.onMessage.removeListener(onMsg)
            void chrome.storage.session.remove(key)
            reject(new Error(wErr.message))
          }
        }
      )
    })
  })
}
