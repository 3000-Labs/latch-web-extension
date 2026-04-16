/**
 * Background Service Worker — the ONLY execution context that may hold key material.
 *
 * Responsibilities:
 * - Encrypted vault (keys never leave this context)
 * - Transaction signing
 * - Message routing from popup and content scripts
 *
 * Security rule: NEVER send raw private keys in chrome.runtime.sendMessage responses.
 */

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  // TODO: Route messages to vault / signer handlers
  console.log('[latch:background] message received', message)
  sendResponse({ ok: true })
  return true // keep channel open for async responses
})

export {}
