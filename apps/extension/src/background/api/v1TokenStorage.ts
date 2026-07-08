import type { V1TokenPair } from '@latch/types'

const STORAGE_KEY = 'latch.v1TokensByWallet'

type TokenStore = Record<string, V1TokenPair>

async function readStore(): Promise<TokenStore> {
  const res = await chrome.storage.local.get(STORAGE_KEY)
  return (res[STORAGE_KEY] as TokenStore | undefined) ?? {}
}

async function writeStore(store: TokenStore): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY]: store })
}

export async function getV1TokenPair(wallet: string): Promise<V1TokenPair | undefined> {
  const store = await readStore()
  return store[wallet.trim()]
}

export async function setV1TokenPair(wallet: string, pair: V1TokenPair): Promise<void> {
  const store = await readStore()
  store[wallet.trim()] = pair
  await writeStore(store)
}

export async function clearV1TokenPair(wallet: string): Promise<void> {
  const store = await readStore()
  delete store[wallet.trim()]
  await writeStore(store)
}

export function isTokenFresh(pair: V1TokenPair, skewMs = 30_000): boolean {
  return pair.expiresAt - skewMs > Date.now()
}
