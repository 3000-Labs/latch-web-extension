export type SwapNetwork = 'testnet' | 'mainnet'

export type SwapAsset = {
  assetId: string
  symbol: string
  contractId: string
  decimals: number
  issuer?: string
  name?: string
}

export type SwapQuoteRequest = {
  network: SwapNetwork
  assetIn: SwapAsset
  assetOut: SwapAsset
  amountInRaw: string
  slippageBps: number
  recipient: string
}

export type AquariusBuildPayload = {
  kind: 'aquarius'
  swapChainXdr: string
  routerContractId: string
  amountInRaw: string
  amountOutMinRaw: string
  tokenInContractId: string
}

export type SoroswapBuildPayload = {
  kind: 'soroswap'
  quote: Record<string, unknown>
}

export type SwapBuildPayload = AquariusBuildPayload | SoroswapBuildPayload

export type SwapQuote = {
  providerId: string
  providerName: string
  amountInRaw: string
  amountOutRaw: string
  amountOutMinRaw: string
  pathLabels: string[]
  pools?: string[]
  expiresAtMs: number
  buildPayload: SwapBuildPayload
}

export type SwapProviderMeta = {
  id: string
  name: string
}

export interface SwapProvider {
  id: string
  name: string
  quote(req: SwapQuoteRequest): Promise<SwapQuote>
  buildUnsignedTx(
    req: SwapQuoteRequest,
    quote: SwapQuote,
    smartAccountAddress: string,
    transactionSourceG: string,
    rpcUrl: string,
    networkPassphrase: string
  ): Promise<string>
}
