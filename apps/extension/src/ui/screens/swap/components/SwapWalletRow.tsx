import React from 'react'

import chevronDownIconUrl from 'url:../../../../../assets/home/icon-chevron-down.svg'
import walletIconUrl from 'url:../../../../../assets/home/icon-wallet.svg'

export function SwapWalletRow({
  walletLabel,
  balance,
  showWalletPicker,
  showAddFunds,
  showMax,
  onAddFundsClick,
  onMaxClick,
}: {
  walletLabel: string
  balance: number
  showWalletPicker?: boolean
  showAddFunds?: boolean
  showMax?: boolean
  onAddFundsClick?: () => void
  onMaxClick?: () => void
}) {
  return (
    <div className="flex w-full items-center justify-between border-t border-border pt-4">
      {showWalletPicker ? (
        <button
          type="button"
          className="flex shrink-0 items-center whitespace-nowrap text-xs tracking-[-0.24px] text-muted"
        >
          <span>{walletLabel}</span>
          <img src={chevronDownIconUrl} alt="" className="size-4 shrink-0" aria-hidden />
        </button>
      ) : (
        <span className="shrink-0 whitespace-nowrap text-xs tracking-[-0.24px] text-muted">
          {walletLabel}
        </span>
      )}

      <div className="flex shrink-0 items-center gap-1 whitespace-nowrap">
        <img src={walletIconUrl} alt="" className="size-3.5 shrink-0" aria-hidden />
        <span className="text-xs tracking-[-0.24px] text-muted">{balance}</span>
        {showMax ? (
          <button
            type="button"
            onClick={onMaxClick}
            className="shrink-0 text-xs font-medium tracking-[-0.12px] text-primary"
          >
            Max
          </button>
        ) : null}
        {showAddFunds ? (
          <button
            type="button"
            onClick={onAddFundsClick}
            className="shrink-0 text-xs font-medium tracking-[-0.12px] text-primary"
          >
            Add Funds
          </button>
        ) : null}
      </div>
    </div>
  )
}
