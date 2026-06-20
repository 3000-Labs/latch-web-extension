import { sendToBackground } from '../lib/backgroundClient'

async function openWalletPopupFallback(windowId?: number): Promise<void> {
  try {
    if ('action' in chrome && typeof chrome.action.openPopup === 'function') {
      await chrome.action.openPopup(windowId !== undefined ? { windowId } : undefined)
      return
    }
  } catch {
    // fall through
  }

  await chrome.windows.create({
    url: chrome.runtime.getURL('popup.html'),
    type: 'popup',
    width: 360,
    height: 600,
  })
}

async function closeCurrentTab(): Promise<void> {
  const tab = await chrome.tabs.getCurrent()
  if (tab?.id !== undefined) {
    await chrome.tabs.remove(tab.id)
  }
}

/** After onboarding, open the wallet in the side panel (Phantom / MetaMask style). */
export async function openWalletAfterOnboarding(): Promise<void> {
  const win = await chrome.windows.getCurrent()
  const windowId = win?.id

  await sendToBackground({
    type: 'OPEN_WALLET_AFTER_ONBOARDING',
    payload: undefined,
  })

  if (windowId !== undefined && 'sidePanel' in chrome) {
    try {
      await chrome.sidePanel.open({ windowId })
      await closeCurrentTab()
      return
    } catch {
      // fall through to popup
    }
  }

  await openWalletPopupFallback(windowId)
  await closeCurrentTab()
}
