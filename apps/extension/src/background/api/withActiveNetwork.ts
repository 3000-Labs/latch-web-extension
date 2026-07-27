import type { Network } from '@latch/types'

import { getActiveNetwork } from '../network/config'

/** Merge active Stellar network into an API body (preserve explicit mainnet/testnet). */
export async function withActiveNetwork<T extends object>(
  req: T
): Promise<T & { network: Network }> {
  const existing = (req as { network?: unknown }).network
  const network: Network =
    existing === 'mainnet' || existing === 'testnet' ? existing : await getActiveNetwork()
  return { ...req, network }
}
