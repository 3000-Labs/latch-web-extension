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
    <div className="mt-8 flex flex-col items-center">
      <div className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-xl bg-[#0C1E19]">
        <TokenAvatar symbol={assetCode} iconUrl={iconUrl} className="h-6 w-6 rounded-none" />
      </div>
      <div className="mt-5 text-[44px] font-bold tracking-tight text-white leading-none">
        {amountUsd}
      </div>
      {status === 'completed' ? (
        <span className="mt-4 rounded-lg bg-[#34C759]/15 px-3 py-1 text-[13px] font-semibold text-[#34C759]">
          Completed
        </span>
      ) : (
        <span className="mt-4 rounded-lg bg-[#FFAD00]/15 px-3 py-1 text-[13px] font-semibold text-[#FFAD00]">
          Pending
        </span>
      )}
    </div>
  )
}
