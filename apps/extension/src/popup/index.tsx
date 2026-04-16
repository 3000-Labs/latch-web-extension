import React from 'react'

/**
 * Popup entry point.
 * Plasmo maps this file → browser_action popup.
 * No key material ever lives here — all signing is delegated to background via chrome.runtime.sendMessage.
 */
export default function Popup() {
  return (
    <div style={{ width: 360, minHeight: 600, padding: 24 }}>
      <h1>Latch</h1>
      <p>Stellar Smart Account Wallet</p>
    </div>
  )
}
