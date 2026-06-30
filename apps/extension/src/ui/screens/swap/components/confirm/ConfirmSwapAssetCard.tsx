import React from 'react'

import type { SwapTokenVm } from '../../../../swap/swapVm'
import { SwapTokenAvatar } from '../SwapTokenAvatar'

export function ConfirmSwapAssetCard({
  token,
  title,
  subtitle,
  trailing,
}: {
  token: SwapTokenVm
  title: string
  subtitle?: string
  trailing?: React.ReactNode
}) {
  return (
    <div className="flex w-full items-center justify-between rounded-[18px] bg-[#222121] px-3 py-4">
      <div className="flex min-w-0 items-center gap-2">
        <SwapTokenAvatar token={token} />
        <div className="flex min-w-0 flex-col gap-2">
          <p className="truncate text-lg font-semibold tracking-[-0.36px] text-[#fcfcfc]">
            {title}
          </p>
          {subtitle ? (
            <p className="truncate text-sm tracking-[-0.28px] text-[#b3b3b3]">{subtitle}</p>
          ) : null}
        </div>
      </div>
      {trailing ? <div className="ml-2 shrink-0">{trailing}</div> : null}
    </div>
  )
}
