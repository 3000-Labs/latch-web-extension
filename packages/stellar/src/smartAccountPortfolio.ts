import { Asset } from '@stellar/stellar-sdk'

import type { HorizonAccountRecord } from './horizonTypes'
import { isHorizonCreditBalance } from './horizonTypes'
import { parseHorizonAccountJson } from './migrationBalances'
import { fetchSacBalanceRaw, formatSacRawToHuman, STELLAR_SAC_DISPLAY_DECIMALS } from './sacBalance'

export type PortfolioTokenProbe = {
  code: string
  issuer?: string
  sacContractId: string
}

/**
 * Build SAC contract ids to probe: native + credit lines on classic G account.
 */
export function portfolioProbesFromHorizonAccount(
  record: HorizonAccountRecord,
  networkPassphrase: string
): PortfolioTokenProbe[] {
  const probes: PortfolioTokenProbe[] = []
  const nativeSac = Asset.native().contractId(networkPassphrase)
  probes.push({ code: 'XLM', sacContractId: nativeSac })

  for (const b of record.balances) {
    if (isHorizonCreditBalance(b)) {
      try {
        const sacContractId = new Asset(b.asset_code, b.asset_issuer).contractId(networkPassphrase)
        probes.push({
          code: b.asset_code,
          issuer: b.asset_issuer,
          sacContractId,
        })
      } catch {
        // skip invalid asset pairs
      }
    }
  }

  const seen = new Set<string>()
  return probes.filter((p) => {
    if (seen.has(p.sacContractId)) return false
    seen.add(p.sacContractId)
    return true
  })
}

export async function fetchHorizonAccountJson(
  horizonBaseUrl: string,
  accountId: string,
  signal?: AbortSignal
): Promise<unknown> {
  const url = `${horizonBaseUrl.replace(/\/$/, '')}/accounts/${encodeURIComponent(accountId)}`
  const res = await fetch(url, { headers: { Accept: 'application/json' }, signal })
  if (!res.ok) throw new Error(`Horizon account fetch failed: HTTP ${res.status}`)
  return res.json()
}

export interface SmartAccountPortfolioRow {
  code: string
  issuer?: string
  sacContractId: string
  amount: string
}

/**
 * Reads Soroban SAC balances for C-address for each probe (parallel RPC).
 */
export async function loadSmartAccountPortfolioRows(params: {
  rpcUrl: string
  networkPassphrase: string
  cAddress: string
  gAddress?: string
  horizonUrl: string
  signal?: AbortSignal
}): Promise<SmartAccountPortfolioRow[]> {
  const probes: PortfolioTokenProbe[] = [
    { code: 'XLM', sacContractId: Asset.native().contractId(params.networkPassphrase) },
  ]

  if (params.gAddress?.trim()) {
    try {
      const json = await fetchHorizonAccountJson(
        params.horizonUrl,
        params.gAddress.trim(),
        params.signal
      )
      const record = parseHorizonAccountJson(json)
      if (record) {
        const fromG = portfolioProbesFromHorizonAccount(record, params.networkPassphrase)
        for (const p of fromG) {
          if (!probes.some((x) => x.sacContractId === p.sacContractId)) probes.push(p)
        }
      }
    } catch {
      // keep native-only
    }
  }

  const results = await Promise.all(
    probes.map(async (p) => {
      const raw = await fetchSacBalanceRaw(
        params.rpcUrl,
        params.cAddress,
        p.sacContractId,
        params.signal
      )
      const human = formatSacRawToHuman(raw, STELLAR_SAC_DISPLAY_DECIMALS)
      return { ...p, raw, human }
    })
  )

  const rows: SmartAccountPortfolioRow[] = []
  for (const r of results) {
    if (r.code === 'XLM') {
      rows.push({
        code: r.code,
        sacContractId: r.sacContractId,
        amount: r.human,
      })
      continue
    }
    if (r.raw > 0n) {
      rows.push({
        code: r.code,
        issuer: r.issuer,
        sacContractId: r.sacContractId,
        amount: r.human,
      })
    }
  }

  rows.sort((a, b) => {
    if (a.code === 'XLM') return -1
    if (b.code === 'XLM') return 1
    return a.code.localeCompare(b.code)
  })

  return rows
}
