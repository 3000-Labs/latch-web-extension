import React from 'react'

import { TokenAvatar } from '../../components/TokenAvatar'
import type { HistoryItemVm } from '../../types/history'

export function HistoryTransactionRow({
  item,
  onClick,
}: {
  item: HistoryItemVm
  onClick?: () => void
}) {
  const statusLabel = item.status === 'pending' ? 'Pending Transaction' : 'Completed'

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-2xl border border-border bg-surface/40 px-4 py-4 text-left hover:bg-surface/60"
    >
      <div className="flex min-w-0 items-center gap-3">
        <TokenAvatar symbol={item.assetCode} iconUrl={item.iconUrl} />
        <div className="min-w-0">
          <div className="truncate text-sm font-extrabold">{item.asset}</div>
          <div className="text-xs font-bold text-muted">{statusLabel}</div>
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div className="text-sm font-extrabold">{item.amountLabel}</div>
        <div className="text-xs font-bold text-muted">{item.timeLabel}</div>
      </div>
    </button>
  )
}
