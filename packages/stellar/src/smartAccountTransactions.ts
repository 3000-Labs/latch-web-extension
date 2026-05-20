import { Address, Asset, scValToNative, xdr } from '@stellar/stellar-sdk'

import { parseHorizonAccountJson } from './migrationBalances'
import { formatSacRawToHuman, STELLAR_SAC_DISPLAY_DECIMALS } from './sacBalance'
import {
  fetchHorizonAccountJson,
  loadSmartAccountPortfolioRows,
  portfolioProbesFromHorizonAccount,
  type PortfolioTokenProbe,
} from './smartAccountPortfolio'

export interface SmartAccountPayment {
  id: string
  transactionHash: string
  type: string
  from: string
  to: string
  amount: string
  assetType: string
  assetCode?: string
  createdAt: string
}

const MAX_SAC_PROBE_CONTRACTS = 15
/** ~1–2 days on testnet. */
const EVENT_LEDGER_WINDOW = 17_000
const EVENT_LEDGER_WINDOW_FALLBACK = 4_320
const EVENT_PAGE_SIZE = 200
const MAX_EVENT_PAGES_PER_CONTRACT = 15
const MAX_TRANSFERS_PER_CONTRACT = 50

async function horizonGet(url: string, signal?: AbortSignal): Promise<unknown> {
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal,
  })
  if (!res.ok) return null
  try {
    return await res.json()
  } catch {
    return null
  }
}

async function sorobanRpc(rpcUrl: string, method: string, params: object, signal?: AbortSignal): Promise<unknown> {
  const res = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    signal,
  })
  try {
    return await res.json()
  } catch {
    return {}
  }
}

/** Normalize contract/account strkeys for comparison. */
export function stellarAddressEquals(a: string, b: string): boolean {
  try {
    return Address.fromString(a).toString() === Address.fromString(b).toString()
  } catch {
    return a === b
  }
}

function topicToSymbol(topicB64: string): string {
  try {
    const val = xdr.ScVal.fromXDR(topicB64, 'base64')
    if (val.switch() === xdr.ScValType.scvSymbol()) return val.sym().toString()
  } catch {
    // ignore
  }
  return ''
}

function topicToAddress(topicB64: string): string {
  try {
    const val = xdr.ScVal.fromXDR(topicB64, 'base64')
    if (val.switch() !== xdr.ScValType.scvAddress()) return ''
    return Address.fromScAddress(val.address()).toString()
  } catch {
    return ''
  }
}

function parseTransferAmountRaw(event: Record<string, unknown>): bigint {
  const raw = event.value
  if (raw == null) return 0n
  const val = xdr.ScVal.fromXDR(String(raw), 'base64')
  const native = scValToNative(val)
  if (typeof native === 'bigint') return native >= 0n ? native : 0n
  if (native && typeof native === 'object' && 'amount' in native) {
    const amt = (native as { amount?: unknown }).amount
    if (typeof amt === 'bigint') return amt >= 0n ? amt : 0n
  }
  return 0n
}

function mergeProbes(...lists: PortfolioTokenProbe[][]): PortfolioTokenProbe[] {
  const out: PortfolioTokenProbe[] = []
  const seen = new Set<string>()
  for (const list of lists) {
    for (const p of list) {
      if (seen.has(p.sacContractId)) continue
      seen.add(p.sacContractId)
      out.push(p)
    }
  }
  return out.slice(0, MAX_SAC_PROBE_CONTRACTS)
}

export async function buildSacProbesForHistory(params: {
  horizonUrl: string
  networkPassphrase: string
  gAddress?: string | null
  signal?: AbortSignal
}): Promise<PortfolioTokenProbe[]> {
  const probes: PortfolioTokenProbe[] = [
    { code: 'XLM', sacContractId: Asset.native().contractId(params.networkPassphrase) },
  ]

  const g = params.gAddress?.trim()
  if (g) {
    try {
      const json = await fetchHorizonAccountJson(params.horizonUrl, g, params.signal)
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

  return probes.slice(0, MAX_SAC_PROBE_CONTRACTS)
}

function paymentDedupeKey(tx: SmartAccountPayment): string {
  if (tx.id) return tx.id
  return `${tx.transactionHash}|${tx.assetCode ?? ''}|${tx.from}|${tx.to}|${tx.amount}`
}

async function fetchGAddressHistory(
  horizonUrl: string,
  gAddress: string,
  cAddress: string,
  signal?: AbortSignal,
): Promise<SmartAccountPayment[]> {
  const resp = (await horizonGet(
    `${horizonUrl.replace(/\/$/, '')}/accounts/${encodeURIComponent(gAddress)}/operations?limit=50&order=desc`,
    signal,
  )) as { _embedded?: { records?: unknown[] } } | null

  const allOps = (resp?._embedded?.records ?? []) as Record<string, unknown>[]
  const invokeOps = allOps.filter((r) => r.type === 'invoke_host_function')
  if (invokeOps.length === 0) return []

  const effectsBatch = await Promise.all(
    invokeOps.map((op) =>
      horizonGet(
        `${horizonUrl.replace(/\/$/, '')}/operations/${String(op.id)}/effects`,
        signal,
      ).then((r) => (r as { _embedded?: { records?: unknown[] } } | null)?._embedded?.records ?? []),
    ),
  )

  const results: SmartAccountPayment[] = []
  for (let i = 0; i < invokeOps.length; i++) {
    const op = invokeOps[i]!
    const effects = effectsBatch[i] as Record<string, unknown>[]

    const matchesCAddress = (e: Record<string, unknown>) =>
      e.account === cAddress || e.contract === cAddress
    const creditEffect = effects.find((e) => e.type === 'contract_credited' && matchesCAddress(e))
    const debitEffect = effects.find((e) => e.type === 'contract_debited' && matchesCAddress(e))
    if (!creditEffect && !debitEffect) continue

    const isIncoming = !!creditEffect
    const effect = (creditEffect ?? debitEffect)!

    results.push({
      id: `horizon-op-${String(op.id)}`,
      transactionHash: String(op.transaction_hash ?? ''),
      type: 'invoke_host_function',
      from: isIncoming ? String(op.source_account) : cAddress,
      to: isIncoming ? cAddress : String(op.source_account),
      amount: String(effect.amount ?? '0'),
      assetType: effect.asset_type === 'native' ? 'native' : 'credit_alphanum4',
      assetCode: typeof effect.asset_code === 'string' ? effect.asset_code : undefined,
      createdAt: String(op.created_at ?? ''),
    })
  }

  return results
}

type SorobanEventsPage = {
  result?: { events?: unknown[]; cursor?: string }
  error?: { message?: string }
}

async function fetchContractEventsPaginated(
  rpcUrl: string,
  sacContractId: string,
  startLedger: number,
  signal?: AbortSignal,
): Promise<Record<string, unknown>[]> {
  const collected: Record<string, unknown>[] = []
  let cursor: string | undefined

  for (let page = 0; page < MAX_EVENT_PAGES_PER_CONTRACT; page++) {
    const resp = (await sorobanRpc(
      rpcUrl,
      'getEvents',
      {
        startLedger,
        filters: [{ type: 'contract', contractIds: [sacContractId] }],
        pagination: { limit: EVENT_PAGE_SIZE, ...(cursor ? { cursor } : {}) },
      },
      signal,
    )) as SorobanEventsPage

    if (resp?.error) return collected

    const events = (resp.result?.events ?? []) as Record<string, unknown>[]
    collected.push(...events)
    cursor = resp.result?.cursor
    if (!cursor || events.length === 0) break
  }

  return collected
}

async function fetchSacTransferEventsForContract(
  rpcUrl: string,
  cAddress: string,
  probe: PortfolioTokenProbe,
  latestLedger: number,
  signal?: AbortSignal,
): Promise<SmartAccountPayment[]> {
  const sacContractId = probe.sacContractId
  const isNative = probe.code.toUpperCase() === 'XLM' && !probe.issuer

  const mapEvent = (event: Record<string, unknown>, index: number): SmartAccountPayment | null => {
    try {
      const topics = (event.topic ?? []) as string[]
      if (topics.length < 3) return null
      if (topicToSymbol(topics[0]!) !== 'transfer') return null
      const from = topicToAddress(topics[1]!)
      const to = topicToAddress(topics[2]!)
      if (!from || !to) return null
      if (!stellarAddressEquals(from, cAddress) && !stellarAddressEquals(to, cAddress)) return null

      const amountRaw = parseTransferAmountRaw(event)
      const txHash = String(event.txHash ?? event.transactionHash ?? '')
      const eventId = event.id != null ? String(event.id) : ''
      return {
        id:
          eventId ||
          `${txHash}:${sacContractId}:${index}:${from}:${to}:${amountRaw.toString()}`,
        transactionHash: txHash,
        type: 'sac_transfer',
        from,
        to,
        amount: formatSacRawToHuman(amountRaw, STELLAR_SAC_DISPLAY_DECIMALS),
        assetType: isNative ? 'native' : 'credit_alphanum4',
        assetCode: probe.code,
        createdAt: String(event.ledgerClosedAt ?? ''),
      }
    } catch {
      return null
    }
  }

  const startLedgers = [
    Math.max(1, latestLedger - EVENT_LEDGER_WINDOW),
    Math.max(1, latestLedger - EVENT_LEDGER_WINDOW_FALLBACK),
  ]

  for (const startLedger of startLedgers) {
    const events = await fetchContractEventsPaginated(rpcUrl, sacContractId, startLedger, signal)
    const matches: SmartAccountPayment[] = []
    for (let i = 0; i < events.length; i++) {
      const mapped = mapEvent(events[i]!, i)
      if (mapped) matches.push(mapped)
      if (matches.length >= MAX_TRANSFERS_PER_CONTRACT) break
    }
    if (matches.length > 0) return matches
  }

  return []
}

async function fetchSacTransferEventsForProbes(
  rpcUrl: string,
  cAddress: string,
  probes: PortfolioTokenProbe[],
  signal?: AbortSignal,
): Promise<SmartAccountPayment[]> {
  const latestLedgerResp = (await sorobanRpc(rpcUrl, 'getLatestLedger', {}, signal)) as {
    result?: { sequence?: number }
    error?: unknown
  }
  const latestLedger = latestLedgerResp?.result?.sequence ?? 0
  if (latestLedger === 0 || probes.length === 0) return []

  const settled = await Promise.allSettled(
    probes.map((probe) =>
      fetchSacTransferEventsForContract(rpcUrl, cAddress, probe, latestLedger, signal),
    ),
  )

  const seen = new Set<string>()
  const merged: SmartAccountPayment[] = []
  for (const result of settled) {
    if (result.status !== 'fulfilled') continue
    for (const tx of result.value) {
      if (!tx.transactionHash) continue
      const key = paymentDedupeKey(tx)
      if (seen.has(key)) continue
      seen.add(key)
      merged.push(tx)
    }
  }

  return merged
}

export async function fetchSmartAccountPayments(params: {
  cAddress: string
  gAddress?: string | null
  horizonUrl: string
  rpcUrl: string
  networkPassphrase: string
  signal?: AbortSignal
}): Promise<SmartAccountPayment[]> {
  const trustlineProbes = await buildSacProbesForHistory({
    horizonUrl: params.horizonUrl,
    networkPassphrase: params.networkPassphrase,
    gAddress: params.gAddress,
    signal: params.signal,
  })

  let portfolioProbes: PortfolioTokenProbe[] = []
  try {
    const rows = await loadSmartAccountPortfolioRows({
      rpcUrl: params.rpcUrl,
      networkPassphrase: params.networkPassphrase,
      cAddress: params.cAddress,
      gAddress: params.gAddress,
      horizonUrl: params.horizonUrl,
      signal: params.signal,
    })
    portfolioProbes = rows.map((r) => ({
      code: r.code,
      issuer: r.issuer,
      sacContractId: r.sacContractId,
    }))
  } catch {
    // use trustline probes only
  }

  const probes = mergeProbes(trustlineProbes, portfolioProbes)

  const [gAddrResult, sacResult] = await Promise.allSettled([
    params.gAddress
      ? fetchGAddressHistory(params.horizonUrl, params.gAddress, params.cAddress, params.signal)
      : Promise.resolve([]),
    fetchSacTransferEventsForProbes(params.rpcUrl, params.cAddress, probes, params.signal),
  ])

  const horizonTxs = gAddrResult.status === 'fulfilled' ? gAddrResult.value : []
  const sacEvents = sacResult.status === 'fulfilled' ? sacResult.value : []

  const seen = new Set<string>()
  const merged: SmartAccountPayment[] = []
  for (const tx of [...sacEvents, ...horizonTxs]) {
    if (!tx.transactionHash) continue
    const key = paymentDedupeKey(tx)
    if (seen.has(key)) continue
    seen.add(key)
    merged.push(tx)
  }

  return merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}
