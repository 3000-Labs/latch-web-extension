import { fetchSmartAccountPayments, stellarAddressEquals } from '@latch/stellar'

import type { GetSmartAccountTransactionsResponse, SmartAccountTransactionRow } from '@latch/types'

import {
  getStellarNetworkFromEnv,
  horizonUrlFromEnv,
  networkPassphraseFromEnv,
  sorobanRpcUrlFromEnv,
} from './migration/env'
import { getAccounts } from './storage'
import { getMarketPrices } from './marketPrices'
import { computeBalanceUsd } from './tokenPrices'

type Snapshot = {
  updatedAtMs: number
  data: GetSmartAccountTransactionsResponse
}

const FRESH_TTL_MS = 60_000
const MAX_STALE_MS = 5 * 60_000

let memoryCacheByAccountId: Map<string, Snapshot> | null = null
const inflightByAccountId: Map<string, Promise<GetSmartAccountTransactionsResponse>> = new Map()

function snapshotFreshEnough(s: Snapshot, now: number): boolean {
  return now - s.updatedAtMs < FRESH_TTL_MS
}

function snapshotUsableAsStaleFallback(s: Snapshot, now: number): boolean {
  return now - s.updatedAtMs < MAX_STALE_MS
}

function storageKeyForAccount(accountId: string): string {
  const network = getStellarNetworkFromEnv()
  return `latch.smartAccountTransactions.${network}.${accountId}.v1`
}

async function readPersistedSnapshot(accountId: string): Promise<Snapshot | null> {
  try {
    const key = storageKeyForAccount(accountId)
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
    const key = storageKeyForAccount(accountId)
    await chrome.storage.local.set({ [key]: snapshot })
  } catch {
    // best-effort only
  }
}

function classifyKind(
  tx: { from: string; to: string },
  cAddress: string,
  gAddress?: string
): SmartAccountTransactionRow['kind'] {
  if (
    stellarAddressEquals(tx.to, cAddress) &&
    gAddress &&
    stellarAddressEquals(tx.from, gAddress)
  ) {
    return 'deposit'
  }
  if (stellarAddressEquals(tx.from, cAddress)) return 'sent'
  if (stellarAddressEquals(tx.to, cAddress)) return 'received'
  return 'received'
}

async function computeTransactionsOnce(accountId: string): Promise<GetSmartAccountTransactionsResponse> {
  const { accounts } = await getAccounts()
  const acc = accounts.find((a) => a.id === accountId)
  const c = acc?.smartAccountAddress?.trim()
  if (!c) return { items: [] }

  const g = acc?.gAddress?.trim()
  const payments = await fetchSmartAccountPayments({
    cAddress: c,
    gAddress: g,
    horizonUrl: horizonUrlFromEnv(),
    rpcUrl: sorobanRpcUrlFromEnv(),
    networkPassphrase: networkPassphraseFromEnv(),
  })

  const codes = payments.map((p) => p.assetCode ?? (p.assetType === 'native' ? 'XLM' : 'ASSET'))
  const { pricesByCodeUpper } = await getMarketPrices(codes)

  const items: SmartAccountTransactionRow[] = payments.map((p) => {
    const code = p.assetCode ?? (p.assetType === 'native' ? 'XLM' : 'ASSET')
    const kind = classifyKind(p, c, g)
    const isSent = stellarAddressEquals(p.from, c)
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

function revalidateInBackground(accountId: string): void {
  if (inflightByAccountId.has(accountId)) return

  const p = computeTransactionsOnce(accountId)
    .then(async (data) => {
      const snapshot: Snapshot = { updatedAtMs: Date.now(), data }
      memoryCacheByAccountId!.set(accountId, snapshot)
      await writePersistedSnapshot(accountId, snapshot)
      return data
    })
    .finally(() => {
      inflightByAccountId.delete(accountId)
    })

  inflightByAccountId.set(accountId, p)
  void p.catch(() => {})
}

export async function runGetSmartAccountTransactions(
  accountId: string
): Promise<GetSmartAccountTransactionsResponse> {
  const now = Date.now()
  if (!memoryCacheByAccountId) {
    memoryCacheByAccountId = new Map()
  }

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

  const p = computeTransactionsOnce(accountId)
    .then(async (data) => {
      const snapshot: Snapshot = { updatedAtMs: Date.now(), data }
      memoryCacheByAccountId!.set(accountId, snapshot)
      await writePersistedSnapshot(accountId, snapshot)
      return data
    })
    .finally(() => {
      inflightByAccountId.delete(accountId)
    })

  inflightByAccountId.set(accountId, p)

  try {
    return await p
  } catch (e) {
    const fallback = memoryCacheByAccountId.get(accountId)
    if (fallback && snapshotUsableAsStaleFallback(fallback, Date.now())) {
      return fallback.data
    }
    throw e
  }
}
