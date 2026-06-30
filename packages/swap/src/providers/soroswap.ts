import { SOROSWAP_API_BASE } from '../constants'
import { applySlippageMin, QUOTE_TTL_MS } from '../amounts'
import type { SoroswapBuildPayload, SwapProvider, SwapQuote, SwapQuoteRequest } from '../types'

type SoroswapQuoteResponse = {
  amountIn?: string
  amountOut?: string
  assetIn?: string
  assetOut?: string
  tradeType?: string
  protocols?: string[]
  path?: string[]
  [key: string]: unknown
}

type SoroswapBuildResponse = {
  xdr?: string
  error?: string
  message?: string
}

function soroswapApiKey(): string {
  const key = process.env.PLASMO_PUBLIC_SOROSWAP_API_KEY?.trim()
  if (!key) {
    throw new Error('Soroswap API key not configured (PLASMO_PUBLIC_SOROSWAP_API_KEY)')
  }
  return key
}

async function soroswapPost<T>(
  endpoint: string,
  network: 'testnet' | 'mainnet',
  body: Record<string, unknown>
): Promise<T> {
  const res = await fetch(`${SOROSWAP_API_BASE}${endpoint}?network=${network}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${soroswapApiKey()}`,
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string; error?: string }
    throw new Error(err.message ?? err.error ?? `Soroswap API error (${res.status})`)
  }
  return (await res.json()) as T
}

function parseSoroswapQuote(data: SoroswapQuoteResponse, req: SwapQuoteRequest): SwapQuote {
  const amountOutRaw = data.amountOut
  if (!amountOutRaw) throw new Error('No swap route found for this pair')

  const amountOutMinRaw = applySlippageMin(amountOutRaw, req.slippageBps)
  const buildPayload: SoroswapBuildPayload = {
    kind: 'soroswap',
    quote: data as Record<string, unknown>,
  }

  return {
    providerId: 'soroswap',
    providerName: 'Soroswap',
    amountInRaw: req.amountInRaw,
    amountOutRaw,
    amountOutMinRaw,
    pathLabels: [req.assetIn.symbol, req.assetOut.symbol],
    expiresAtMs: Date.now() + QUOTE_TTL_MS,
    buildPayload,
  }
}

export const soroswapProvider: SwapProvider = {
  id: 'soroswap',
  name: 'Soroswap',
  async quote(req: SwapQuoteRequest): Promise<SwapQuote> {
    const data = await soroswapPost<SoroswapQuoteResponse>('/quote', req.network, {
      assetIn: req.assetIn.contractId,
      assetOut: req.assetOut.contractId,
      amount: req.amountInRaw,
      tradeType: 'EXACT_IN',
      protocols: ['soroswap', 'phoenix', 'aqua'],
    })
    return parseSoroswapQuote(data, req)
  },
  async buildUnsignedTx(req, quote, smartAccountAddress, _transactionSourceG, _rpcUrl, _networkPassphrase) {
    if (quote.buildPayload.kind !== 'soroswap') {
      throw new Error('Invalid build payload for Soroswap provider')
    }
    const data = await soroswapPost<SoroswapBuildResponse>('/quote/build', req.network, {
      quote: quote.buildPayload.quote,
      from: smartAccountAddress,
      to: smartAccountAddress,
    })
    if (!data.xdr) {
      throw new Error(data.message ?? data.error ?? 'Soroswap build failed')
    }
    return data.xdr
  },
}
