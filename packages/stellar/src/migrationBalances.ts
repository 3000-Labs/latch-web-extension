import { Asset } from '@stellar/stellar-sdk'

import type { MigrableAsset } from '@latch/types'

import type { HorizonAccountRecord, HorizonBalanceLine } from './horizonTypes'
import { isHorizonCreditBalance } from './horizonTypes'

/** Stellar minimum account balance: (2 + subentries) × 0.5 XLM */
export function stellarMinReserveXlm(subentryCount: number): number {
  return (2 + subentryCount) * 0.5
}

const DISCOVERY_NATIVE_EPS = 0.000_000_1

/**
 * Builds the list of assets on G that should appear in migration discovery.
 * Uses ledger reserve rule; does not subtract future tx fees (sweep recomputes).
 */
export function migrableAssetsFromHorizonAccount(
  account: HorizonAccountRecord,
  networkPassphrase: string
): MigrableAsset[] {
  const sub = account.subentry_count ?? 0
  const minReserve = stellarMinReserveXlm(sub)
  const assets: MigrableAsset[] = []

  for (const b of account.balances) {
    if (b.asset_type === 'native') {
      const total = Number.parseFloat(b.balance)
      const transferable = total - minReserve
      if (transferable > DISCOVERY_NATIVE_EPS) {
        assets.push({
          kind: 'native',
          code: 'XLM',
          amount: transferable.toFixed(7),
          sacContractId: Asset.native().contractId(networkPassphrase),
        })
      }
    } else if (isHorizonCreditBalance(b)) {
      const amt = Number.parseFloat(b.balance)
      if (amt > 0) {
        try {
          const sacContractId = new Asset(b.asset_code, b.asset_issuer).contractId(
            networkPassphrase
          )
          assets.push({
            kind: 'token',
            code: b.asset_code,
            issuer: b.asset_issuer,
            amount: b.balance,
            sacContractId,
          })
        } catch {
          // Issuer/code cannot form SAC on this network — skip per spike "no SAC" handling
        }
      }
    }
  }

  return assets
}

export function parseHorizonAccountJson(body: unknown): HorizonAccountRecord | null {
  if (!body || typeof body !== 'object') return null
  const o = body as Record<string, unknown>
  if (typeof o.id !== 'string' || typeof o.sequence !== 'string') return null
  if (!Array.isArray(o.balances)) return null
  const balances: HorizonBalanceLine[] = []
  for (const raw of o.balances) {
    if (!raw || typeof raw !== 'object') continue
    const x = raw as Record<string, unknown>
    if (x.asset_type === 'native' && typeof x.balance === 'string') {
      balances.push({ asset_type: 'native', balance: x.balance })
      continue
    }
    if (
      (x.asset_type === 'credit_alphanum4' || x.asset_type === 'credit_alphanum12') &&
      typeof x.balance === 'string' &&
      typeof x.asset_code === 'string' &&
      typeof x.asset_issuer === 'string'
    ) {
      balances.push({
        asset_type: x.asset_type,
        asset_code: x.asset_code,
        asset_issuer: x.asset_issuer,
        balance: x.balance,
      })
    }
  }
  const sub = o.subentry_count
  return {
    id: o.id,
    sequence: o.sequence,
    subentry_count: typeof sub === 'number' ? sub : Number(sub) || 0,
    balances,
  }
}
