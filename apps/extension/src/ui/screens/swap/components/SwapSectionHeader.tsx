import React from 'react'

import { ExchangeBalanceToggle } from './ExchangeBalanceToggle'

export function SwapSectionHeader({
  label,
  showExchangeBalance,
  useExchangeBalance,
  onExchangeBalanceChange,
}: {
  label: string
  showExchangeBalance?: boolean
  useExchangeBalance?: boolean
  onExchangeBalanceChange?: (v: boolean) => void
}) {
  return (
    <div className="flex h-[20px] w-full items-center justify-between">
      <p className="text-xs tracking-[-0.24px] text-muted">{label}</p>
      {showExchangeBalance ? (
        <div className="flex items-center gap-2">
          <p className="text-xs tracking-[-0.24px] text-muted">Use Exchange Balance</p>
          <ExchangeBalanceToggle
            checked={useExchangeBalance ?? false}
            onChange={onExchangeBalanceChange ?? (() => {})}
          />
        </div>
      ) : null}
    </div>
  )
}
