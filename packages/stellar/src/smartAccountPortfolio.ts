import { Asset, Networks } from '@stellar/stellar-sdk'

import { curatedPortfolioProbes, type StellarNetwork } from './curatedAssets'
import type { HorizonAccountRecord } from './horizonTypes'
import { isHorizonCreditBalance } from './horizonTypes'
import { parseHorizonAccountJson } from './migrationBalances'
import { mergePortfolioProbes } from './portfolioProbes'
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

function networkFromPassphrase(networkPassphrase: string): StellarNetwork {
  return networkPassphrase === Networks.PUBLIC ? 'mainnet' : 'testnet'
}

async function gTrustlineProbes(
  horizonUrl: string,
  gAddress: string,
  networkPassphrase: string,
  signal?: AbortSignal
): Promise<PortfolioTokenProbe[]> {
  try {
    const json = await fetchHorizonAccountJson(horizonUrl, gAddress.trim(), signal)
    const record = parseHorizonAccountJson(json)
    if (!record) return []
    return portfolioProbesFromHorizonAccount(record, networkPassphrase)
  } catch {
    return []
  }
}

/**
 * Build deduped SAC probe list for a smart account (no RPC balance reads).
 */
export async function buildSmartAccountPortfolioProbes(params: {
  network: StellarNetwork
  networkPassphrase: string
  gAddress?: string
  horizonUrl: string
  additionalProbes?: PortfolioTokenProbe[]
  signal?: AbortSignal
}): Promise<PortfolioTokenProbe[]> {
  const nativeSac = Asset.native().contractId(params.networkPassphrase)
  const xlmProbe: PortfolioTokenProbe = { code: 'XLM', sacContractId: nativeSac }

  const gProbes = params.gAddress?.trim()
    ? await gTrustlineProbes(
        params.horizonUrl,
        params.gAddress,
        params.networkPassphrase,
        params.signal
      )
    : []

  return mergePortfolioProbes([
    [xlmProbe],
    curatedPortfolioProbes(params.networkPassphrase, params.network),
    gProbes,
    params.additionalProbes ?? [],
  ])
}

/**
 * Reads Soroban SAC balances for C-address for each probe (parallel RPC).
 */
export async function loadSmartAccountPortfolioRows(params: {
  rpcUrl: string
  networkPassphrase: string
  network?: StellarNetwork
  cAddress: string
  gAddress?: string
  horizonUrl: string
  additionalProbes?: PortfolioTokenProbe[]
  signal?: AbortSignal
}): Promise<SmartAccountPortfolioRow[]> {
  const network = params.network ?? networkFromPassphrase(params.networkPassphrase)
  const probes = await buildSmartAccountPortfolioProbes({
    network,
    networkPassphrase: params.networkPassphrase,
    gAddress: params.gAddress,
    horizonUrl: params.horizonUrl,
    additionalProbes: params.additionalProbes,
    signal: params.signal,
  })

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
