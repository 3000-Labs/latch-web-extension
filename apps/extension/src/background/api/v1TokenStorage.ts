import type { Network, V1TokenPair } from '@latch/types'

import { getActiveNetwork } from '../network/config'

const STORAGE_KEY = 'latch.v1TokensByWallet'

type TokenStore = Record<string, V1TokenPair>

/** True once this SW lifetime has dropped legacy bare-wallet keys. */
let prunedLegacyKeys = false

export function v1TokenStorageKey(network: Network, wallet: string): string {
  return `${network}:${wallet.trim()}`
}

function isScopedKey(key: string): boolean {
  return key.startsWith('testnet:') || key.startsWith('mainnet:')
}

async function readStore(): Promise<TokenStore> {
  const res = await chrome.storage.local.get(STORAGE_KEY)
  return (res[STORAGE_KEY] as TokenStore | undefined) ?? {}
}

async function writeStore(store: TokenStore): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY]: store })
}

/** Drop pre-network-scoped entries once so a testnet JWT is never reused on mainnet. */
async function pruneLegacyBareWalletKeys(store: TokenStore): Promise<TokenStore> {
  if (prunedLegacyKeys) return store
  prunedLegacyKeys = true
  let changed = false
  const next: TokenStore = { ...store }
  for (const key of Object.keys(next)) {
    if (!isScopedKey(key)) {
      delete next[key]
      changed = true
    }
  }
  if (changed) await writeStore(next)
  return next
}

/** Test helper: allow re-running the one-time prune. */
export function resetV1TokenLegacyPruneFlag(): void {
  prunedLegacyKeys = false
}

export async function getV1TokenPair(wallet: string): Promise<V1TokenPair | undefined> {
  const network = await getActiveNetwork()
  const store = await pruneLegacyBareWalletKeys(await readStore())
  return store[v1TokenStorageKey(network, wallet)]
}

export async function setV1TokenPair(wallet: string, pair: V1TokenPair): Promise<void> {
  const network = await getActiveNetwork()
  const store = await pruneLegacyBareWalletKeys(await readStore())
  store[v1TokenStorageKey(network, wallet)] = pair
  // Ensure a bare-wallet legacy key cannot shadow the scoped entry.
  delete store[wallet.trim()]
  await writeStore(store)
}

export async function clearV1TokenPair(wallet: string): Promise<void> {
  const network = await getActiveNetwork()
  const store = await pruneLegacyBareWalletKeys(await readStore())
  delete store[v1TokenStorageKey(network, wallet)]
  delete store[wallet.trim()]
  await writeStore(store)
}

export function isTokenFresh(pair: V1TokenPair, skewMs = 30_000): boolean {
  return pair.expiresAt - skewMs > Date.now()
}
