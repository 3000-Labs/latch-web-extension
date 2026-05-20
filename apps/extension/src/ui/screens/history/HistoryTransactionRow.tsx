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
      className="flex w-full items-center justify-between rounded-2xl border border-border/20 bg-surface px-4 py-[14px] text-left hover:bg-surface/75 active:bg-surface/85 transition-all cursor-pointer"
    >
      <div className="flex min-w-0 items-center gap-3">
        <TokenAvatar symbol={item.assetCode} iconUrl={item.iconUrl} rounded="rounded-xl" />
        <div className="min-w-0">
          <div className="truncate text-sm font-extrabold text-fg">{item.asset}</div>
          <div className="text-xs font-semibold text-muted/70 mt-0.5">{statusLabel}</div>
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div className="text-sm font-extrabold text-fg">{item.amountLabel}</div>
        <div className="text-xs font-semibold text-muted/70 mt-0.5">{item.timeLabel}</div>
      </div>
    </button>
  )
}
