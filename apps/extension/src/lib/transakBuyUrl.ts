/**
 * Open a Transak on-ramp widget tab.
 *
 * Transak requires a backend Create Widget URL session (`widget_url`). The
 * extension must not build Transak URLs client-side with the partner secret.
 */
export async function openTransakBuyTab(params: { widgetUrl: string }): Promise<void> {
  const url = params.widgetUrl.trim()
  if (!url) {
    throw new Error('Transak widget URL is missing (backend must return widget_url)')
  }
  await chrome.tabs.create({ url })
}
