import type { Network } from '@latch/types'

/** Plasmo inlines `process.env.PLASMO_PUBLIC_*` at build time. */
export function webauthnVerifierAddressFromEnv(network: Network = 'testnet'): string | undefined {
  if (network === 'mainnet') {
    const mainnet = process.env.PLASMO_PUBLIC_WEBAUTHN_VERIFIER_ADDRESS_MAINNET as
      string | undefined
    if (typeof mainnet === 'string' && mainnet.trim() !== '') return mainnet.trim()
    // Never fall back to the testnet verifier on mainnet — that contract is not deployed
    // on public, and setup-send-rules fails with a generic "failed to build setup transaction".
    return undefined
  }
  const raw = process.env.PLASMO_PUBLIC_WEBAUTHN_VERIFIER_ADDRESS as string | undefined
  if (typeof raw !== 'string') return undefined
  const trimmed = raw.trim()
  return trimmed.length > 0 ? trimmed : undefined
}
