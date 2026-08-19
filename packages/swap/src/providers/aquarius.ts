import {
  Address,
  BASE_FEE,
  Contract,
  nativeToScVal,
  rpc,
  StrKey,
  TransactionBuilder,
  xdr,
} from '@stellar/stellar-sdk'

import { applySlippageMin, QUOTE_TTL_MS } from '../amounts'
import { AQUARIUS_CONFIG } from '../constants'
import type { AquariusBuildPayload, SwapProvider, SwapQuote, SwapQuoteRequest } from '../types'

type AquariusFindPathResponse = {
  success: boolean
  amount?: number | string
  swap_chain_xdr?: string
  pools?: string[]
  tokens?: string[]
  error?: string
}

function tokenLabelFromPathToken(token: string): string {
  if (token === 'native') return 'XLM'
  const colon = token.indexOf(':')
  if (colon > 0) return token.slice(0, colon)
  return token.slice(0, 8)
}

function contractAddressScVal(contractId: string) {
  return Address.contract(StrKey.decodeContract(contractId)).toScVal()
}

export function parseAquariusFindPathResponse(
  data: AquariusFindPathResponse,
  req: SwapQuoteRequest
): SwapQuote {
  if (!data.success || !data.swap_chain_xdr || data.amount === undefined) {
    throw new Error(data.error ?? 'No swap route found for this pair')
  }
  const amountOutRaw = String(data.amount)
  const amountOutMinRaw = applySlippageMin(amountOutRaw, req.slippageBps)
  const config = AQUARIUS_CONFIG[req.network]
  const pathLabels = data.tokens?.map(tokenLabelFromPathToken) ?? [
    req.assetIn.symbol,
    req.assetOut.symbol,
  ]

  const buildPayload: AquariusBuildPayload = {
    kind: 'aquarius',
    swapChainXdr: data.swap_chain_xdr,
    routerContractId: config.routerContractId,
    amountInRaw: req.amountInRaw,
    amountOutMinRaw,
    tokenInContractId: req.assetIn.contractId,
  }

  return {
    providerId: 'aquarius',
    providerName: 'Aquarius',
    amountInRaw: req.amountInRaw,
    amountOutRaw,
    amountOutMinRaw,
    pathLabels,
    pools: data.pools,
    expiresAtMs: Date.now() + QUOTE_TTL_MS,
    buildPayload,
  }
}

export async function fetchAquariusQuote(req: SwapQuoteRequest): Promise<SwapQuote> {
  const config = AQUARIUS_CONFIG[req.network]
  const body = {
    token_in_address: req.assetIn.contractId,
    token_out_address: req.assetOut.contractId,
    amount: req.amountInRaw,
  }
  const res = await fetch(`${config.apiBase}/find-path/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    if (text.includes('does not exist')) {
      throw new Error('This token is not available for swap on the current network.')
    }
    throw new Error(text || `Aquarius quote failed (${res.status})`)
  }
  const data = (await res.json()) as AquariusFindPathResponse
  return parseAquariusFindPathResponse(data, req)
}

export async function buildAquariusUnsignedTx(args: {
  smartAccountAddress: string
  transactionSourceG: string
  buildPayload: AquariusBuildPayload
  rpcUrl: string
  networkPassphrase: string
}): Promise<string> {
  const { smartAccountAddress, transactionSourceG, buildPayload, rpcUrl, networkPassphrase } = args

  if (!transactionSourceG.startsWith('G')) {
    throw new Error('Swap transaction source must be a Stellar G-address.')
  }
  if (!smartAccountAddress.startsWith('C')) {
    throw new Error('Smart account address must be a contract C-address.')
  }

  const server = new rpc.Server(rpcUrl, { allowHttp: rpcUrl.startsWith('http:') })
  const sourceAccount = await server.getAccount(transactionSourceG)

  const swapsChain = xdr.ScVal.fromXDR(buildPayload.swapChainXdr, 'base64')
  const router = new Contract(buildPayload.routerContractId)

  const tx = new TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase,
  })
    .addOperation(
      router.call(
        'swap_chained',
        contractAddressScVal(smartAccountAddress),
        swapsChain,
        contractAddressScVal(buildPayload.tokenInContractId),
        nativeToScVal(BigInt(buildPayload.amountInRaw), { type: 'u128' }),
        nativeToScVal(BigInt(buildPayload.amountOutMinRaw), { type: 'u128' })
      )
    )
    .setTimeout(300)
    .build()

  const sim = await server.simulateTransaction(tx)
  if (rpc.Api.isSimulationError(sim)) {
    throw new Error(sim.error ?? 'Swap simulation failed')
  }

  const prepared = rpc.assembleTransaction(tx, sim).build()
  return prepared.toXDR()
}

export const aquariusProvider: SwapProvider = {
  id: 'aquarius',
  name: 'Aquarius',
  quote: fetchAquariusQuote,
  buildUnsignedTx(req, quote, smartAccountAddress, transactionSourceG, rpcUrl, networkPassphrase) {
    if (quote.buildPayload.kind !== 'aquarius') {
      throw new Error('Invalid build payload for Aquarius provider')
    }
    return buildAquariusUnsignedTx({
      smartAccountAddress,
      transactionSourceG,
      buildPayload: quote.buildPayload,
      rpcUrl,
      networkPassphrase,
    })
  },
}
