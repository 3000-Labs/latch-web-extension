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
