import type { SmartAccountTransactionRow } from '@latch/types'

import type { HistoryItemVm, HistorySectionVm } from '../types/history'

export function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return ''
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diffMs / 60_000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return '1d ago'
  return `${days}d ago`
}

function dateSectionLabel(dateStr?: string): string {
  if (!dateStr) return 'Unknown'
  const d = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
}

export function mapTransactionToHistoryItem(
  row: SmartAccountTransactionRow,
  iconUrl?: string | null,
): HistoryItemVm {
  const asset =
    row.kind === 'swap'
      ? `Swap ${row.assetCode}`
      : row.assetCode === 'XLM'
        ? 'Stellar'
        : row.assetCode
  return {
    id: row.id,
    kind: row.kind,
    asset,
    assetCode: row.assetCode,
    status: row.status,
    timeLabel: formatRelativeTime(row.createdAt),
    amountLabel: row.amountLabel,
    amountUsd: row.amountUsd,
    iconUrl,
    transactionHash: row.transactionHash,
    createdAt: row.createdAt,
    from: row.from,
    to: row.to,
  }
}

export function groupHistoryItems(items: HistoryItemVm[]): HistorySectionVm[] {
  const map = new Map<string, HistoryItemVm[]>()
  for (const item of items) {
    const label = dateSectionLabel(item.createdAt)
    const group = map.get(label) ?? []
    group.push(item)
    map.set(label, group)
  }
  return Array.from(map.entries()).map(([title, sectionItems]) => ({
    title,
    items: sectionItems,
  }))
}

export function buildTransactionDetail(
  item: HistoryItemVm,
  cAddress: string,
  networkLabel: string,
): import('../types/transaction-detail').TransactionDetailVm {
  return {
    id: item.id,
    transactionHash: item.transactionHash,
    assetCode: item.assetCode,
    iconUrl: item.iconUrl,
    amountUsd: item.amountUsd ?? item.amountLabel,
    status: item.status,
    createdAt: item.createdAt,
    from: item.from,
    to: item.to,
    networkFee: '—',
    blockNumber: '—',
    networkLabel,
    stepTimes: ['~~', '~~', '~~'],
  }
}

export function iconUrlForCode(
  portfolioRows: { code: string; iconUrl?: string | null }[],
  code: string,
): string | null | undefined {
  return portfolioRows.find((r) => r.code === code)?.iconUrl
}
