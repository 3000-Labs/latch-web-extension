import React from 'react'

import { TokenAvatar } from '../../components/TokenAvatar'

export function TransactionDetailHero({
  assetCode,
  iconUrl,
  amountUsd,
  status,
}: {
  assetCode: string
  iconUrl?: string | null
  amountUsd: string
  status: 'completed' | 'pending'
}) {
  return (
    <div className="mt-6 flex flex-col items-center">
      <TokenAvatar symbol={assetCode} iconUrl={iconUrl} className="h-14 w-14 rounded-2xl" />
      <div className="mt-4 text-[32px] font-bold tracking-tight text-fg">{amountUsd}</div>
      {status === 'completed' ? (
        <span className="mt-2 rounded-full bg-emerald-900/80 px-3 py-1 text-xs font-bold text-emerald-300">
          Completed
        </span>
      ) : (
        <span className="mt-2 rounded-full bg-surface px-3 py-1 text-xs font-bold text-muted">Pending</span>
      )}
    </div>
  )
}
