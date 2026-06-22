import React, { useMemo, useState } from 'react'

import type { SwapDraft, SwapQuoteVm, SwapTokenVm } from '../swap/swapVm'
import {
  formatCompactAmount,
  mockQuote,
  swapTokens as defaultSwapTokens,
  toPositiveNumberOrNull,
} from '../swap/swapVm'
import { SwapDetails } from '../swap/components/SwapDetails'
import { TokenPickerModal } from '../swap/components/TokenPickerModal'
import { SwapCardsStack } from './swap/components/SwapCardsStack'
import { SwapEnterAmountButton } from './swap/components/SwapEnterAmountButton'
import { SwapScreenHeader } from './swap/components/SwapScreenHeader'
import { MAIN_BOTTOM_NAV_CLEARANCE_PX } from './home/components/MainBottomNav'

const WALLET_LABEL = 'My Wallet...670d'

export function SwapScreen({
  surface,
  initialState,
  onBack,
  onContinue,
  swapTokenCatalog = defaultSwapTokens,
}: {
  surface: 'popup' | 'sidepanel'
  initialState?: SwapDraft
  onBack: () => void
  onContinue: (quote: SwapQuoteVm, draft: SwapDraft) => void
  swapTokenCatalog?: SwapTokenVm[]
}) {
  const [payTokenId, setPayTokenId] = useState(initialState?.payTokenId ?? 'xlm')
  const [receiveTokenId, setReceiveTokenId] = useState(initialState?.receiveTokenId ?? 'usdt')
  const [payAmount, setPayAmount] = useState(initialState?.payAmount ?? '')
  const [useExchangeBalance, setUseExchangeBalance] = useState(
    initialState?.useExchangeBalance ?? false
  )
  const [pickerTarget, setPickerTarget] = useState<'pay' | 'receive' | null>(null)

  const payToken = useMemo(
    () => swapTokenCatalog.find((t) => t.id === payTokenId) ?? swapTokenCatalog[0],
    [payTokenId, swapTokenCatalog]
  )
  const receiveToken = useMemo(
    () => swapTokenCatalog.find((t) => t.id === receiveTokenId) ?? swapTokenCatalog[1],
    [receiveTokenId, swapTokenCatalog]
  )

  const payN = toPositiveNumberOrNull(payAmount)
  const canApprove = payN !== null && payN > 0

  const payBalance = 10
  const receiveBalance = 0

  const draft: SwapDraft = useMemo(
    () => ({
      payTokenId,
      receiveTokenId,
      payAmount,
      useExchangeBalance,
      approved: canApprove,
    }),
    [canApprove, payAmount, payTokenId, receiveTokenId, useExchangeBalance]
  )

  const previewQuote = useMemo(
    () => (canApprove ? mockQuote(draft, payToken, receiveToken) : null),
    [canApprove, draft, payToken, receiveToken]
  )

  const payUsdApprox = payN === null ? '≈--' : `≈$${(payN * 1.00046).toFixed(5)}`
  const receiveDisplayAmount =
    previewQuote === null ? '--' : formatCompactAmount(previewQuote.receiveAmount, 6)
  const receiveUsdApprox = previewQuote?.receiveUsdApprox ?? '≈--'

  const handleSwapTokens = () => {
    setPayTokenId(receiveTokenId)
    setReceiveTokenId(payTokenId)
  }

  const handleSelectToken = (tokenId: string) => {
    if (pickerTarget === 'pay') {
      if (tokenId === receiveTokenId) {
        handleSwapTokens()
      } else {
        setPayTokenId(tokenId)
      }
    } else if (pickerTarget === 'receive') {
      if (tokenId === payTokenId) {
        handleSwapTokens()
      } else {
        setReceiveTokenId(tokenId)
      }
    }
  }

  const ctaLabel = canApprove ? 'Approve Swap' : 'Enter Amount'

  return (
    <>
      <div
        className={[
          'flex min-h-0 flex-1 flex-col overflow-y-auto',
          surface === 'sidepanel' ? 'pt-2' : 'pt-3',
        ].join(' ')}
        style={{ paddingBottom: MAIN_BOTTOM_NAV_CLEARANCE_PX }}
      >
        <SwapScreenHeader onBack={onBack} />

        <div className="mt-4 flex flex-col gap-5">
          <div className="flex flex-col gap-8">
            <SwapCardsStack
              payToken={payToken}
              receiveToken={receiveToken}
              payBalance={payBalance}
              receiveBalance={receiveBalance}
              walletLabel={WALLET_LABEL}
              useExchangeBalance={useExchangeBalance}
              onExchangeBalanceChange={setUseExchangeBalance}
              onSwapDirection={handleSwapTokens}
              onPayTokenSelect={() => setPickerTarget('pay')}
              onReceiveTokenSelect={() => setPickerTarget('receive')}
              onAddFundsClick={() => {}}
              onMaxClick={() => setPayAmount(String(payBalance))}
              payUsdApprox={payUsdApprox}
              receiveUsdApprox={receiveUsdApprox}
              receiveMuted={!canApprove}
              receiveDisplayAmount={receiveDisplayAmount}
              payAmountInput={
                <input
                  inputMode="decimal"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full min-w-[72px] bg-transparent text-right text-xl font-semibold tracking-[-0.4px] text-white outline-none placeholder:text-white"
                />
              }
            />

            <SwapEnterAmountButton
              label={ctaLabel}
              disabled={!canApprove}
              onClick={() => {
                if (!canApprove || !previewQuote) return
                onContinue(previewQuote, { ...draft, approved: true })
              }}
            />
          </div>

          {previewQuote ? <SwapDetails quote={previewQuote} /> : null}
        </div>
      </div>

      <TokenPickerModal
        isOpen={pickerTarget !== null}
        onClose={() => setPickerTarget(null)}
        tokens={swapTokenCatalog}
        selectedTokenId={pickerTarget === 'pay' ? payTokenId : receiveTokenId}
        onSelect={handleSelectToken}
      />
    </>
  )
}
