import { Networks } from '@stellar/stellar-sdk'

export type StellarNetworkId = 'testnet' | 'mainnet'

export function getStellarNetworkFromEnv(): StellarNetworkId {
  const n = process.env.PLASMO_PUBLIC_STELLAR_NETWORK
  return n === 'mainnet' ? 'mainnet' : 'testnet'
}

export function networkPassphraseFromEnv(): string {
  return getStellarNetworkFromEnv() === 'mainnet' ? Networks.PUBLIC : Networks.TESTNET
}

export function horizonUrlFromEnv(): string {
  const raw = process.env.PLASMO_PUBLIC_HORIZON_URL
  return typeof raw === 'string' && raw.trim() !== ''
    ? raw.trim()
    : 'https://horizon-testnet.stellar.org'
}

export function sorobanRpcUrlFromEnv(): string {
  const raw = process.env.PLASMO_PUBLIC_SOROBAN_RPC_URL
  return typeof raw === 'string' && raw.trim() !== ''
    ? raw.trim()
    : 'https://soroban-testnet.stellar.org'
}
