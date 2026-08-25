import {
  buildSmartAccountPortfolioProbes,
  fetchSmartAccountPayments,
  stellarAddressEquals,
  type SmartAccountPayment,
} from '@latch/stellar'

import type { GetSmartAccountTransactionsResponse, SmartAccountTransactionRow } from '@latch/types'
import type { Network } from '@latch/types'

import { getKnownSacProbes, recordKnownSacProbes } from './knownSacProbes'
import {
  getActiveNetwork,
  horizonUrlFor,
  networkPassphraseFor,
  sorobanRpcUrlFor,
} from './network/config'
import { getAccounts } from './storage'
import { getMarketPrices } from './marketPrices'
import { computeBalanceUsd } from './tokenPrices'

/** Public bundler G from env (same as swap fee-payer). Avoid importing @latch/swap barrel here. */
function resolveBundlerPublicG(network: Network): string | undefined {
  if (network === 'mainnet') {
    const mainnet = process.env.PLASMO_PUBLIC_LATCH_FEE_PAYER_G_MAINNET?.trim()
    if (mainnet?.startsWith('G')) return mainnet
    return undefined
  }
  const fromEnv = process.env.PLASMO_PUBLIC_LATCH_FEE_PAYER_G?.trim()
  return fromEnv?.startsWith('G') ? fromEnv : undefined
}

type Snapshot = {
  updatedAtMs: number
  data: GetSmartAccountTransactionsResponse
}

const FRESH_TTL_MS = 60_000
const MAX_STALE_MS = 5 * 60_000

let memoryCacheByAccountId: Map<string, Snapshot> | null = null
const inflightByAccountId: Map<string, Promise<GetSmartAccountTransactionsResponse>> = new Map()

export function clearSmartAccountTransactionsMemoryCache(): void {
  memoryCacheByAccountId = null
  inflightByAccountId.clear()
}

function snapshotFreshEnough(s: Snapshot, now: number): boolean {
  return now - s.updatedAtMs < FRESH_TTL_MS
}

function snapshotUsableAsStaleFallback(s: Snapshot, now: number): boolean {
  return now - s.updatedAtMs < MAX_STALE_MS
}

async function storageKeyForAccount(accountId: string): Promise<string> {
  const network = await getActiveNetwork()
  return `latch.smartAccountTransactions.${network}.${accountId}.v1`
}

async function readPersistedSnapshot(accountId: string): Promise<Snapshot | null> {
  try {
    const key = await storageKeyForAccount(accountId)
    const r = await chrome.storage.local.get([key])
    const raw = r[key]
    if (!raw || typeof raw !== 'object') return null
    const s = raw as Partial<Snapshot>
    if (typeof s.updatedAtMs !== 'number') return null
    if (!s.data || typeof s.data !== 'object') return null
    return { updatedAtMs: s.updatedAtMs, data: s.data as GetSmartAccountTransactionsResponse }
  } catch {
    return null
  }
}

async function writePersistedSnapshot(accountId: string, snapshot: Snapshot): Promise<void> {
  try {
    const key = await storageKeyForAccount(accountId)
    await chrome.storage.local.set({ [key]: snapshot })
  } catch {
    // best-effort only
  }
}

function classifyKind(
  tx: SmartAccountPayment,
  cAddress: string,
  gAddress?: string
): SmartAccountTransactionRow['kind'] {
  if (tx.txType === 'swap') return 'swap'
  if (
    stellarAddressEquals(tx.to, cAddress) &&
    gAddress &&
    stellarAddressEquals(tx.from, gAddress)
  ) {
    return 'deposit'
  }
  if (tx.txType === 'send' || stellarAddressEquals(tx.from, cAddress)) return 'sent'
  if (tx.txType === 'receive' || stellarAddressEquals(tx.to, cAddress)) return 'received'
  return 'received'
}

async function computeTransactionsOnce(
  accountId: string,
  signal?: AbortSignal
): Promise<GetSmartAccountTransactionsResponse> {
  const { accounts } = await getAccounts()
  const acc = accounts.find((a) => a.id === accountId)
  const c = acc?.smartAccountAddress?.trim()
  if (!c) return { items: [] }

  const g = acc?.gAddress?.trim()
  const network = await getActiveNetwork()
  const horizonUrl = horizonUrlFor(network)
  const rpcUrl = sorobanRpcUrlFor(network)
  const networkPassphrase = networkPassphraseFor(network)
  const bundlerGAddress = resolveBundlerPublicG(network)
  const additionalProbes = await getKnownSacProbes(accountId)

  const payments = await fetchSmartAccountPayments({
    cAddress: c,
    gAddress: g,
    bundlerGAddress,
    horizonUrl,
    rpcUrl,
    networkPassphrase,
    network,
    additionalProbes,
    signal,
  })

  void buildSmartAccountPortfolioProbes({
    network,
    networkPassphrase,
    gAddress: g,
    horizonUrl,
    additionalProbes,
  }).then((probes) => recordKnownSacProbes(accountId, probes))

  const codes = payments.map((p) => p.assetCode ?? (p.assetType === 'native' ? 'XLM' : 'ASSET'))
  const { pricesByCodeUpper } = await getMarketPrices(codes)

  const items: SmartAccountTransactionRow[] = payments.map((p) => {
    const code = p.assetCode ?? (p.assetType === 'native' ? 'XLM' : 'ASSET')
    const kind = classifyKind(p, c, g)
    const isSent = kind === 'sent' || (kind === 'swap' && stellarAddressEquals(p.from, c))
    const sign = isSent ? '-' : '+'
    const amountNum = parseFloat(p.amount)
    const amountLabel = Number.isFinite(amountNum)
      ? `${sign}${amountNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${code}`
      : `${sign}${p.amount} ${code}`
    const priceUsd = pricesByCodeUpper[code.toUpperCase()]?.priceUsd
    const usd = computeBalanceUsd(p.amount.replace(/^-/, ''), priceUsd)
    const amountUsd = usd != null ? `${isSent ? '-' : '+'}$${usd}` : null

    return {
      id: p.id,
      transactionHash: p.transactionHash,
      createdAt: p.createdAt,
      direction: isSent ? 'sent' : 'received',
      assetCode: code,
      amount: p.amount,
      amountLabel,
      amountUsd,
      status: 'completed',
      kind,
      from: p.from,
      to: p.to,
    }
  })

  return { items }
}

function trackInflight(
  accountId: string,
  p: Promise<GetSmartAccountTransactionsResponse>
): Promise<GetSmartAccountTransactionsResponse> {
  inflightByAccountId.set(accountId, p)
  return p.finally(() => {
    if (inflightByAccountId.get(accountId) === p) {
      inflightByAccountId.delete(accountId)
    }
  })
}

function revalidateInBackground(accountId: string): void {
  if (inflightByAccountId.has(accountId)) return

  const p = computeTransactionsOnce(accountId).then(async (data) => {
    const snapshot: Snapshot = { updatedAtMs: Date.now(), data }
    memoryCacheByAccountId!.set(accountId, snapshot)
    await writePersistedSnapshot(accountId, snapshot)
    return data
  })

  void trackInflight(accountId, p).catch(() => {})
}

export async function runGetSmartAccountTransactions(
  accountId: string,
  opts?: { force?: boolean; signal?: AbortSignal }
): Promise<GetSmartAccountTransactionsResponse> {
  const now = Date.now()
  if (!memoryCacheByAccountId) {
    memoryCacheByAccountId = new Map()
  }

  const force = opts?.force === true
  const signal = opts?.signal

  if (!force) {
    const mem = memoryCacheByAccountId.get(accountId)
    if (mem && snapshotFreshEnough(mem, now)) return mem.data

    if (!mem) {
      const persisted = await readPersistedSnapshot(accountId)
      if (persisted) {
        memoryCacheByAccountId.set(accountId, persisted)
        if (snapshotFreshEnough(persisted, now)) return persisted.data
        if (snapshotUsableAsStaleFallback(persisted, now)) {
          revalidateInBackground(accountId)
          return persisted.data
        }
      }
    } else if (snapshotUsableAsStaleFallback(mem, now)) {
      revalidateInBackground(accountId)
      return mem.data
    }

    const existing = inflightByAccountId.get(accountId)
    if (existing) return await existing
  }

  const p = computeTransactionsOnce(accountId, signal).then(async (data) => {
    const snapshot: Snapshot = { updatedAtMs: Date.now(), data }
    memoryCacheByAccountId!.set(accountId, snapshot)
    await writePersistedSnapshot(accountId, snapshot)
    return data
  })

  try {
    return await trackInflight(accountId, p)
  } catch (e) {
    const fallback = memoryCacheByAccountId.get(accountId)
    if (fallback && snapshotUsableAsStaleFallback(fallback, Date.now())) {
      return fallback.data
    }
    throw e
  }
}
