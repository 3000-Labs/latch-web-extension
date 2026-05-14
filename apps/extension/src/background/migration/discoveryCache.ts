import type { MigrationDiscovery } from '@latch/types'

import { getStellarNetworkFromEnv } from './env'

const TTL_MS = 60_000

const cache = new Map<string, { at: number; value: MigrationDiscovery }>()

function key(accountId: string, gAddress: string) {
  return `${getStellarNetworkFromEnv()}:${accountId}:${gAddress}`
}

export function getCachedDiscovery(accountId: string, gAddress: string): MigrationDiscovery | undefined {
  const k = key(accountId, gAddress)
  const row = cache.get(k)
  if (!row) return undefined
  if (Date.now() - row.at > TTL_MS) {
    cache.delete(k)
    return undefined
  }
  return row.value
}

export function setCachedDiscovery(accountId: string, gAddress: string, value: MigrationDiscovery) {
  cache.set(key(accountId, gAddress), { at: Date.now(), value })
}

export function invalidateDiscoveryCacheForAccount(accountId: string) {
  const prefix = `${getStellarNetworkFromEnv()}:${accountId}:`
  for (const k of [...cache.keys()]) {
    if (k.startsWith(prefix)) cache.delete(k)
  }
}
