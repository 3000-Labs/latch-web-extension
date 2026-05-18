export type HistoryKind = 'sent' | 'received' | 'deposit' | 'swap'
export type HistoryStatus = 'completed' | 'pending'

export type HistoryItemVm = {
  id: string
  kind: HistoryKind
  asset: string
  assetCode: string
  status: HistoryStatus
  timeLabel: string
  amountLabel: string
  amountUsd: string | null
  iconUrl?: string | null
  transactionHash: string
  createdAt: string
  from: string
  to: string
}

export type HistorySectionVm = {
  title: string
  items: HistoryItemVm[]
}
