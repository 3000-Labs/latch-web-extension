import React from 'react'

import { formatDisplayAmount2dp } from '../../lib/formatDisplay'

export function SendAvailableBalanceRow({
  balance,
  symbol,
  onMax,
}: {
  balance: string
  symbol: string
  onMax: () => void
}) {
  return (
    <div className="flex shrink-0 items-end justify-between gap-3">
      <div>
        <div className="text-xs font-bold text-muted">Available To Send</div>
        <div className="mt-1 text-sm font-extrabold text-fg">
          {formatDisplayAmount2dp(balance)} {symbol}
        </div>
      </div>
      <button
        type="button"
        onClick={onMax}
        className="rounded-xl border border-border bg-surface/40 px-4 py-2 text-sm font-extrabold text-fg hover:bg-surface/60"
      >
        Max
      </button>
    </div>
  )
}
