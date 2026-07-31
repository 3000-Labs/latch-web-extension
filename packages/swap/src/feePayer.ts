import type { SwapNetwork } from './types'

export type SwapFeePayerSource = {
  gAddress?: string
  /** Active Stellar network — selects testnet vs mainnet fee-payer env. Defaults to testnet. */
  network?: SwapNetwork
}

/** Public bundler / fee-payer G from env (never a secret). Network-specific — no testnet→mainnet fallback. */
export function resolveBundlerPublicG(network: SwapNetwork = 'testnet'): string | undefined {
  if (network === 'mainnet') {
    const mainnet = process.env.PLASMO_PUBLIC_LATCH_FEE_PAYER_G_MAINNET?.trim()
    if (mainnet?.startsWith('G')) return mainnet
    return undefined
  }
  const fromEnv = process.env.PLASMO_PUBLIC_LATCH_FEE_PAYER_G?.trim()
  return fromEnv?.startsWith('G') ? fromEnv : undefined
}

/** G-address that pays fees and supplies the transaction sequence (not the smart account C-address). */
export function resolveSwapTransactionSourceG(source: SwapFeePayerSource): string {
  const fromAccount = source.gAddress?.trim()
  if (fromAccount?.startsWith('G')) return fromAccount

  const network = source.network ?? 'testnet'
  const fromEnv = resolveBundlerPublicG(network)
  if (fromEnv) return fromEnv

  const hint =
    network === 'mainnet'
      ? 'Set PLASMO_PUBLIC_LATCH_FEE_PAYER_G_MAINNET in apps/extension/.env'
      : 'Set PLASMO_PUBLIC_LATCH_FEE_PAYER_G in apps/extension/.env'
  throw new Error(
    `Swap fee payer G-address is not configured for ${network}. ${hint} (Latch API bundler public key — public G only, not the secret). Passkey accounts have no linked G, so this env is required for mainnet Soroswap.`
  )
}
