import { applySlippageMin, QUOTE_TTL_MS } from '../amounts'
import type { SwapProvider, SwapQuote, SwapQuoteRequest } from '../types'

export const mockSwapProvider: SwapProvider = {
  id: 'mock',
  name: 'Mock',
  async quote(req: SwapQuoteRequest): Promise<SwapQuote> {
    const amountIn = BigInt(req.amountInRaw)
    const amountOut = (amountIn * 84221n) / 100_000_000n
    const amountOutRaw = amountOut.toString()
    const amountOutMinRaw = applySlippageMin(amountOutRaw, req.slippageBps)

    return {
      providerId: 'mock',
      providerName: 'Mock',
      amountInRaw: req.amountInRaw,
      amountOutRaw,
      amountOutMinRaw,
      pathLabels: [req.assetIn.symbol, req.assetOut.symbol],
      pools: [],
      expiresAtMs: Date.now() + QUOTE_TTL_MS,
      buildPayload: {
        kind: 'aquarius',
        swapChainXdr: '',
        routerContractId: 'CMOCKROUTER',
        amountInRaw: req.amountInRaw,
        amountOutMinRaw,
        tokenInContractId: req.assetIn.contractId,
      },
    }
  },
  async buildUnsignedTx() {
    throw new Error('Mock provider cannot build transactions')
  },
}
