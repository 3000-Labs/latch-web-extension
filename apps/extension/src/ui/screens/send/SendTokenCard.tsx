import React from 'react'

import type { SmartAccountBalanceRow } from '@latch/types'

import { TokenAvatar } from '../../components/TokenAvatar'
import { formatDisplayAmount2dp } from '../../lib/formatDisplay'
import { tokenDisplayName } from '../../lib/sendAddress'

export function SendTokenCard({
  token,
  onSelect,
}: {
  token: SmartAccountBalanceRow
  onSelect: () => void
}) {
  const name = tokenDisplayName(token.code)

  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full items-center gap-2 rounded-[14px] bg-[#2a2928] p-3 text-left"
    >
      <TokenAvatar
        symbol={token.code}
        iconUrl={token.iconUrl}
        className="size-8 border-0 bg-[#1e1e1e] p-1"
        rounded="rounded-lg"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="truncate text-base font-semibold leading-[1.31] tracking-[-0.16px] text-[#fcfcfc]">
          {name}
        </p>
        <div className="flex items-center gap-2 text-sm">
          <span className="shrink-0 font-normal leading-[1.34] tracking-[-0.28px] text-[#b3b3b3]">
            BALANCE
          </span>
          <span className="min-w-0 flex-1 truncate font-medium leading-[1.3] tracking-[-0.14px] text-[#fbfbfb]">
            {formatDisplayAmount2dp(token.amount)} {token.code}
          </span>
        </div>
      </div>
    </button>
  )
}
