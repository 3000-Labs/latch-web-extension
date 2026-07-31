/**
 * Build a MoonPay buy URL for XLM → pool G-address + memo tag.
 *
 * Live (`pk_live_`) URLs that include `walletAddress` require a server-side HMAC
 * `signature` (MoonPay rejects unsigned live widget URLs). Sandbox `pk_test_`
 * keys may omit signature for local development.
 */
export function buildMoonPayBuyUrl(params: {
  poolAddress: string
  memoId: string
  intentId?: string
  apiKey?: string
  /** HMAC signature from the Latch API — must be appended last when present. */
  signature?: string
  /** Active Stellar network; live keys are refused on testnet. */
  network?: 'testnet' | 'mainnet'
}): string {
  const apiKey = (
    params.apiKey ??
    process.env.PLASMO_PUBLIC_MOONPAY_API_KEY ??
    ''
  ).trim()
  if (!apiKey) {
    throw new Error('MoonPay is not configured (missing PLASMO_PUBLIC_MOONPAY_API_KEY)')
  }

  const isLive = apiKey.startsWith('pk_live_')
  if (params.network === 'testnet' && isLive) {
    throw new Error('MoonPay live keys cannot be used while the wallet is on testnet')
  }

  const signature = params.signature?.trim()
  if (isLive && !signature) {
    throw new Error(
      'MoonPay live URLs with walletAddress require a server-signed signature (missing widget_url)'
    )
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

  const qs = search.toString()
  // MoonPay requires `signature` to be the last query parameter.
  if (signature) {
    return `${base}?${qs}&signature=${encodeURIComponent(signature)}`
  }
  return `${base}?${qs}`
}

export async function openMoonPayBuyTab(params: {
  poolAddress: string
  memoId: string
  intentId?: string
  /** Prefer a backend-provided signed buy URL when present. */
  widgetUrl?: string
  network?: 'testnet' | 'mainnet'
  apiKey?: string
}): Promise<void> {
  const signed = params.widgetUrl?.trim()
  if (signed) {
    await chrome.tabs.create({ url: signed })
    return
  }
  const url = buildMoonPayBuyUrl(params)
  await chrome.tabs.create({ url })
}
