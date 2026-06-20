import React from 'react'

import { SwapDirectionButton } from './SwapDirectionButton'
import { SwapSectionHeader } from './SwapSectionHeader'
import { SwapTokenCard } from './SwapTokenCard'
import type { SwapTokenVm } from '../../../swap/swapVm'

export function SwapCardsStack({
  payToken,
  receiveToken,
  payAmountInput,
  payUsdApprox,
  receiveDisplayAmount,
  receiveUsdApprox,
  receiveMuted,
  payBalance,
  receiveBalance,
  walletLabel,
  useExchangeBalance,
  onExchangeBalanceChange,
  onSwapDirection,
  onPayTokenSelect,
  onReceiveTokenSelect,
  onAddFundsClick,
  onMaxClick,
}: {
  payToken: SwapTokenVm
  receiveToken: SwapTokenVm
  payAmountInput: React.ReactNode
  payUsdApprox: string
  receiveDisplayAmount: React.ReactNode
  receiveUsdApprox: string
  receiveMuted?: boolean
  payBalance: number
  receiveBalance: number
  walletLabel: string
  useExchangeBalance: boolean
  onExchangeBalanceChange: (v: boolean) => void
  onSwapDirection: () => void
  onPayTokenSelect: () => void
  onReceiveTokenSelect: () => void
  onAddFundsClick?: () => void
  onMaxClick?: () => void
}) {
  return (
    <div className="relative flex w-full shrink-0 flex-col gap-2 overflow-visible">
      <div className="flex flex-col gap-[13px]">
        <SwapSectionHeader
          label="Pay"
          showExchangeBalance
          useExchangeBalance={useExchangeBalance}
          onExchangeBalanceChange={onExchangeBalanceChange}
        />
        <div className="relative">
          <SwapTokenCard
            token={payToken}
            variant="pay"
            walletLabel={walletLabel}
            balance={payBalance}
            amountTop={payAmountInput}
            amountBottom={payUsdApprox}
            onTokenSelect={onPayTokenSelect}
            onAddFundsClick={onAddFundsClick}
            onMaxClick={onMaxClick}
          />
          <SwapDirectionButton
            onClick={onSwapDirection}
            className="absolute left-[calc(50%+5px)] top-full z-10 -translate-x-1/2 -translate-y-[15px]"
          />
        </div>
      </div>

      <div className="flex flex-col gap-[13px]">
        <SwapSectionHeader label="Receive" />
        <SwapTokenCard
          token={receiveToken}
          variant="receive"
          walletLabel={walletLabel}
          balance={receiveBalance}
          mutedAmount={receiveMuted}
          amountTop={receiveDisplayAmount}
          amountBottom={receiveUsdApprox}
          onTokenSelect={onReceiveTokenSelect}
        />
      </div>
    </div>
  )
}
