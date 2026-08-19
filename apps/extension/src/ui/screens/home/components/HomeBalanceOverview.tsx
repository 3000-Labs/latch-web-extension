import React from 'react'

import eyeHiddenUrl from 'url:../../../../../assets/home/icon-eye-hidden.svg'
import eyeVisibleUrl from 'url:../../../../../assets/home/icon-eye-visible.svg'
import { formatDisplay2dp } from '../../../lib/formatDisplay'

function parseUsd(value?: string | null): number {
  if (!value) return 0
  const n = parseFloat(value.replace(/[^0-9.-]/g, ''))
  return Number.isFinite(n) ? n : 0
}

export function HomeBalanceOverview({
  totalBalanceUsd,
  changePercent,
  hidden,
  onToggleHidden,
}: {
  totalBalanceUsd?: string | null
  changePercent?: string | null
  hidden: boolean
  onToggleHidden: () => void
}) {
  const amount = parseUsd(totalBalanceUsd)
  const mainDisplay = hidden ? '***' : formatDisplay2dp(amount)
  const subDisplay = hidden ? '***' : formatDisplay2dp(amount)
  const percentDisplay = hidden ? '***' : (changePercent ?? '0.00%')

  return (
    <div className="flex w-fit min-w-[133px] flex-col items-center gap-2">
      <div className="flex w-full flex-col items-center gap-1">
        <div className="flex w-full items-center justify-center gap-1">
          <span className="shrink-0 whitespace-nowrap text-center text-sm font-normal leading-[1.34] tracking-[-0.28px] text-muted">
            Total Balance
          </span>
          <button
            type="button"
            className="size-4 shrink-0"
            aria-label={hidden ? 'Show balance' : 'Hide balance'}
            onClick={onToggleHidden}
          >
            <img src={hidden ? eyeVisibleUrl : eyeHiddenUrl} alt="" className="block size-full" />
          </button>
        </div>
        <p className="whitespace-nowrap text-center text-[56px] font-bold leading-[1.2] tracking-[-1.68px] text-fg">
          {mainDisplay}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-[9px]">
        <span className="shrink-0 whitespace-nowrap text-center text-sm font-normal leading-[1.34] tracking-[-0.28px] text-fg">
          {subDisplay}
        </span>
        <div className="flex shrink-0 items-center justify-center rounded-[12px] bg-[rgb(var(--latch-surface-2))] p-2">
          <span className="whitespace-nowrap text-center text-sm font-normal leading-[1.34] tracking-[-0.28px] text-fg">
            {percentDisplay}
          </span>
        </div>
      </div>
    </div>
  )
}
