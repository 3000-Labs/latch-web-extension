import React, { useMemo, useState } from 'react'

import type { SwapDraft, SwapQuoteVm, SwapTokenVm } from '../swap/swapVm'
import {
  formatUsdApprox,
  mockQuote,
  swapTokens as defaultSwapTokens,
  toPositiveNumberOrNull,
} from '../swap/swapVm'
import swapIconUrl from 'url:../../../assets/icons/swap-icon-black.svg'
import { SwapCard } from '../swap/components/SwapCard'
import { SwapDetails } from '../swap/components/SwapDetails'
import { SwapHeader } from '../swap/components/SwapHeader'
import { ToggleSwitch } from '../swap/components/ToggleSwitch'
import { TokenPickerModal } from '../swap/components/TokenPickerModal'

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
  const [approved, setApproved] = useState(initialState?.approved ?? false)

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

  const payBalance = payToken.symbol === 'XLM' ? 10 : 0
  const receiveBalance = receiveToken.symbol === 'XLM' ? 10 : 0

  const draft: SwapDraft = useMemo(
    () => ({ payTokenId, receiveTokenId, payAmount, useExchangeBalance, approved }),
    [approved, payAmount, payTokenId, receiveTokenId, useExchangeBalance]
  )

  const effectiveQuote = useMemo(
    () => (approved ? mockQuote(draft, payToken, receiveToken) : null),
    [approved, draft, payToken, receiveToken]
  )

  const payUsdApprox = payN === null ? '≈--' : formatUsdApprox(payN)

  const receiveDisplayAmount = payN === null ? '--' : payAmount

  const receiveUsdApprox = payN === null ? '≈--' : `≈$${(payN * 1.00046).toFixed(2)}`

  const handleSwapTokens = () => {
    setApproved(false)
    setPayTokenId(receiveTokenId)
    setReceiveTokenId(payTokenId)
  }

  const handleSelectToken = (tokenId: string) => {
    if (pickerTarget === 'pay') {
      if (tokenId === receiveTokenId) {
        handleSwapTokens()
      } else {
        setPayTokenId(tokenId)
        setApproved(false)
      }
    } else if (pickerTarget === 'receive') {
      if (tokenId === payTokenId) {
        handleSwapTokens()
      } else {
        setReceiveTokenId(tokenId)
        setApproved(false)
      }
    }
  }

  const handleMaxClick = () => {
    setPayAmount(String(payBalance))
    setApproved(false)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col animate-screenIn">
      <SwapHeader onBack={onBack} />

      <div className="mt-4 flex-1 overflow-auto pr-1 pb-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-normal text-fg/80">Pay</span>
            <div className="flex items-center gap-1">
              <span className="text-xs font-normal text-fg/80">Use exchange balance</span>
              <ToggleSwitch
                checked={useExchangeBalance}
                onChange={(v) => setUseExchangeBalance(v)}
              />
            </div>
          </div>

          <SwapCard
            token={payToken}
            type="pay"
            onTokenSelect={() => setPickerTarget('pay')}
            rightTop={
              <input
                inputMode="decimal"
                value={payAmount}
                onChange={(e) => {
                  setPayAmount(e.target.value)
                  if (approved) setApproved(false)
                }}
                placeholder="0.00"
                className="w-full bg-transparent text-right text-2xl font-bold tracking-tight text-white outline-none placeholder:text-muted/40"
              />
            }
            rightBottom={payUsdApprox}
            balance={payBalance}
            onMaxClick={handleMaxClick}
            onAddFundsClick={() => {}}
          />

          <div className="relative mt-2 pt-4">
            <button
              type="button"
              onClick={handleSwapTokens}
              className="absolute left-1/2 top-0 z-10 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-primary text-black shadow-soft hover:brightness-95 active:brightness-90 cursor-pointer"
              aria-label="Swap direction"
            >
              <img src={swapIconUrl} alt="" className="h-5 w-5" />
            </button>

            <div className="space-y-2">
              <span className="px-1 text-xs font-normal text-fg/80">Receive</span>
              <SwapCard
                token={receiveToken}
                type="receive"
                onTokenSelect={() => setPickerTarget('receive')}
                rightTop={
                  <span className={payN === null ? 'text-muted' : 'text-white'}>
                    {receiveDisplayAmount}
                  </span>
                }
                rightBottom={receiveUsdApprox}
                balance={receiveBalance}
              />
            </div>
          </div>
        </div>

        {approved && effectiveQuote ? (
          <div className="mt-6">
            <SwapDetails quote={effectiveQuote} />
          </div>
        ) : null}
      </div>

      <div className={['mt-auto pt-4', surface === 'sidepanel' ? 'pb-0' : 'pb-2'].join(' ')}>
        <button
          type="button"
          disabled={!canApprove}
          onClick={() => {
            if (!canApprove) return
            if (!approved) {
              setApproved(true)
              return
            }
            const q = effectiveQuote
            if (!q) return
            onContinue(q, { ...draft, approved: true })
          }}
          className={[
            'h-12 w-full rounded-full text-base font-extrabold shadow-soft transition-all duration-200 cursor-pointer',
            canApprove
              ? 'bg-primary text-black hover:brightness-105 active:scale-[0.98]'
              : 'bg-surface/60 text-muted cursor-not-allowed',
          ].join(' ')}
        >
          {!canApprove ? 'Enter amount' : approved ? 'Approved swap' : 'Approve swap'}
        </button>
      </div>

      <TokenPickerModal
        isOpen={pickerTarget !== null}
        onClose={() => setPickerTarget(null)}
        tokens={swapTokenCatalog}
        selectedTokenId={pickerTarget === 'pay' ? payTokenId : receiveTokenId}
        onSelect={handleSelectToken}
      />
    </div>
  )
}
