export async function openWalletAfterOnboarding(): Promise<void> {
  try {
    if ('action' in chrome && typeof chrome.action.openPopup === 'function') {
      await chrome.action.openPopup()
      window.close()
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
  window.close()
}
