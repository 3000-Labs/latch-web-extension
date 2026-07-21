/**
 * Build an unsigned MoonPay buy URL for XLM → pool G-address + memo tag.
 * Publishable key only — HMAC signing stays server-side for a later PR.
 */
export function buildMoonPayBuyUrl(params: {
  poolAddress: string
  memoId: string
  intentId?: string
  apiKey?: string
}): string {
  const apiKey = (
    params.apiKey ??
    process.env.PLASMO_PUBLIC_MOONPAY_API_KEY ??
    ''
  ).trim()
  if (!apiKey) {
    throw new Error('MoonPay is not configured (missing PLASMO_PUBLIC_MOONPAY_API_KEY)')
  }

  const base = apiKey.startsWith('pk_test_')
    ? 'https://buy-sandbox.moonpay.com'
    : 'https://buy.moonpay.com'

  const search = new URLSearchParams()
  search.set('apiKey', apiKey)
  search.set('currencyCode', 'xlm')
  search.set('showOnlyCurrencies', 'xlm')
  search.set('walletAddress', params.poolAddress)
  search.set('walletAddressTag', params.memoId)
  search.set('showWalletAddressForm', 'true')
  if (params.intentId) {
    search.set('externalTransactionId', params.intentId)
  }

  return `${base}?${search.toString()}`
}

export async function openMoonPayBuyTab(params: {
  poolAddress: string
  memoId: string
  intentId?: string
}): Promise<void> {
  const url = buildMoonPayBuyUrl(params)
  await chrome.tabs.create({ url })
}
