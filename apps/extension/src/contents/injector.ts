/**
 * Content Script — injector.ts
 *
 * Runs in the webpage context (isolated world by default in Plasmo).
 * Injects `window.latch` so dapps can request signatures / pubkeys.
 *
 * Acts only as a proxy: all requests are forwarded to the background SW
 * via chrome.runtime.sendMessage. No key material ever touches this file.
 *
 * Pattern borrowed from Freighter's content script bridge.
 */

import type { PlasmoCSConfig } from 'plasmo'

export const config: PlasmoCSConfig = {
  matches: ['<all_urls>'],
  run_at: 'document_start',
}

function injectLatchProvider() {
  const script = document.createElement('script')
  script.src = chrome.runtime.getURL('inpage.js')
  script.type = 'module'
  ;(document.head || document.documentElement).prepend(script)
}

injectLatchProvider()
