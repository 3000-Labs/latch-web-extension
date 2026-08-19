import type { SwapNetwork } from './types'

export const AQUARIUS_CONFIG: Record<
  SwapNetwork,
  { apiBase: string; routerContractId: string }
> = {
  testnet: {
    apiBase: 'https://amm-api-testnet.aqua.network/api/external/v1',
    routerContractId: 'CBCFTQSPDBAIZ6R6PJQKSQWKNKWH2QIV3I4J72SHWBIK3ADRRAM5A6GD',
  },
  mainnet: {
    apiBase: 'https://amm-api.aqua.network/api/external/v1',
    routerContractId: 'CBQDHNBFBZYE4MKPWBSJOPIYLW4SFSXAXUTSXJN76GNKYVYPCKWC6QUK',
  },
}

export const SOROSWAP_API_BASE = 'https://api.soroswap.finance'

/**
 * Soroswap on-chain targets. Quotes use the aggregator (multi-protocol);
 * `routerContractId` here is the aggregator C-address used for setup-swap-rules.
 * Sourced from soroswap/aggregator public/*.contracts.json.
 */
export const SOROSWAP_CONFIG: Record<
  SwapNetwork,
  { routerContractId: string; ammRouterContractId: string }
> = {
  testnet: {
    routerContractId: 'CC74XDT7UVLUZCELKBIYXFYIX6A6LGPWURJVUXGRPQO745RWX7WEURMA',
    ammRouterContractId: 'CCJUD55AG6W5HAI5LRVNKAE5WDP5XGZBUDS5WNTIVDU7O264UZZE7BRD',
  },
  mainnet: {
    routerContractId: 'CAYP3UWLJM7ZPTUKL6R6BFGTRWLZ46LRKOXTERI2K6BIJAWGYY62TXTO',
    ammRouterContractId: 'CAG5LRYQ5JVEUI5TEID72EYOVX44TTUJT5BQR2J6J77FH65PCCFAJDDH',
  },
}
