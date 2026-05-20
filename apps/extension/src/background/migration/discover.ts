import type { MigrationDiscovery } from '@latch/types'

import { migrableAssetsFromHorizonAccount, parseHorizonAccountJson } from '@latch/stellar'

import { BackendError } from '../backend'
import { getAccounts } from '../storage'
import { getCachedDiscovery, setCachedDiscovery } from './discoveryCache'
import { horizonUrlFromEnv, networkPassphraseFromEnv } from './env'

export async function runMigrationDiscover(accountId: string): Promise<MigrationDiscovery> {
  const { accounts } = await getAccounts()
  const account = accounts.find((a) => a.id === accountId)

  if (!account) {
    throw new BackendError('Account not found', { code: 'no_account' })
  }

  const g = account.gAddress?.trim()
  const c = account.smartAccountAddress?.trim()
  if (!g || !c) {
    return {
      state: 'unsupported',
      gAddress: g ?? '',
      cAddress: c ?? '',
      assets: [],
      unsupportedReason: 'missing_addresses',
    }
  }

  if (account.mode !== 'mnemonic') {
    return {
      state: 'unsupported',
      gAddress: g,
      cAddress: c,
      assets: [],
      unsupportedReason: 'not_mnemonic',
    }
  }

  const cached = getCachedDiscovery(accountId, g)
  if (cached) return cached

  const passphrase = networkPassphraseFromEnv()
  const horizonUrl = horizonUrlFromEnv()

  let response: Response
  try {
    response = await fetch(`${horizonUrl.replace(/\/$/, '')}/accounts/${encodeURIComponent(g)}`)
  } catch {
    const result: MigrationDiscovery = { state: 'not_needed', gAddress: g, cAddress: c, assets: [] }
    setCachedDiscovery(accountId, g, result)
    return result
  }

  if (response.status === 404) {
    const result: MigrationDiscovery = { state: 'not_needed', gAddress: g, cAddress: c, assets: [] }
    setCachedDiscovery(accountId, g, result)
    return result
  }

  if (!response.ok) {
    throw new Error(`Horizon account fetch failed: HTTP ${response.status}`)
  }

  const json: unknown = await response.json()
  const record = parseHorizonAccountJson(json)
  if (!record) {
    throw new Error('Unexpected Horizon account JSON')
  }

  const assets = migrableAssetsFromHorizonAccount(record, passphrase)
  const result: MigrationDiscovery =
    assets.length === 0
      ? { state: 'complete', gAddress: g, cAddress: c, assets: [] }
      : { state: 'not_started', gAddress: g, cAddress: c, assets }

  setCachedDiscovery(accountId, g, result)
  return result
}
