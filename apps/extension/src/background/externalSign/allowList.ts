import type { Network } from '@latch/types'

import { getDappPermissions } from '../storage'

/** Origin must have getPublicKey permission before provider signing. */
export async function isOriginAllowedForSigning(origin: string): Promise<boolean> {
  if (!origin || origin === 'unknown') return false
  const allowed = await getDappPermissions(origin)
  return allowed.includes('getPublicKey')
}

export function allowListStorageKey(origin: string, network: Network, smartAccountAddress: string) {
  return `${origin}|${network}|${smartAccountAddress}`
}
