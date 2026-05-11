import React, { useMemo, useState } from 'react'
import { ChevronDown, ChevronLeft } from 'lucide-react'

import { SectionCard } from '../components/SectionCard'
import type { SwapDraft, SwapQuoteVm } from '../swap/swapVm'
import {
  formatUsdApprox,
  mockQuote,
  swapTokens,
  toPositiveNumberOrNull,
  truncateAddress,
} from '../swap/swapVm'
import swapIconUrl from 'url:../../../assets/icons/swap-icon-black.svg'
import { ToggleSwitch } from '../swap/components/ToggleSwitch'
import { SwapCard } from '../swap/components/SwapCard'
import { KeyValueRow } from '../swap/components/KeyValueRow'

export function SwapScreen({
  surface,
  initialState,
  onBack,
  onContinue,
}: {
  surface: 'popup' | 'sidepanel'
  initialState?: SwapDraft
  onBack: () => void
  onContinue: (quote: SwapQuoteVm, draft: SwapDraft) => void
}) {
  const [payTokenId, setPayTokenId] = useState(initialState?.payTokenId ?? 'usdt')
  const [receiveTokenId, setReceiveTokenId] = useState(initialState?.receiveTokenId ?? 'xlm')
  const [payAmount, setPayAmount] = useState(initialState?.payAmount ?? '')
  const [useExchangeBalance, setUseExchangeBalance] = useState(
    initialState?.useExchangeBalance ?? false
  )
  const [approved, setApproved] = useState(initialState?.approved ?? false)

  const payToken = useMemo(
    () => swapTokens.find((t) => t.id === payTokenId) ?? swapTokens[0],
    [payTokenId]
  )
  const receiveToken = useMemo(
    () => swapTokens.find((t) => t.id === receiveTokenId) ?? swapTokens[1],
    [receiveTokenId]
  )

  const payN = toPositiveNumberOrNull(payAmount)
  const canApprove = payN !== null

  const draft: SwapDraft = useMemo(
    () => ({ payTokenId, receiveTokenId, payAmount, useExchangeBalance, approved }),
    [approved, payAmount, payTokenId, receiveTokenId, useExchangeBalance]
  )

  const quote = useMemo(
    () => (approved ? mockQuote(draft, payToken, receiveToken) : null),
    [approved, draft, payToken, receiveToken]
  )
  const effectiveQuote = useMemo(
    () =>
      approved ? (quote ?? mockQuote({ ...draft, approved: true }, payToken, receiveToken)) : null,
    [approved, draft, payToken, receiveToken, quote]
  )

  const walletLabel = `My Wallet...${truncateAddress('0x6A4A95670d', 4, 4)}`
  const payUsdApprox = payN === null ? '≈ --' : formatUsdApprox(payN)

  const cardFooterTop = (
    <div className="flex items-center justify-between gap-2">
      <button
        type="button"
        className="flex items-center gap-2 text-sm font-bold text-fg/90 hover:text-fg"
      >
        <span className="text-muted font-normal text-xs">{walletLabel}</span>
        <ChevronDown className="h-[18px] w-[18px] text-fg/60" strokeWidth={2} aria-hidden />
      </button>
      <div className="flex items-center gap-2 text-xs font-bold">
        <span className="text-fg/70">0</span>
        <button type="button" className="text-primary text-xs font-normal hover:underline">
          Add Funds
        </button>
      </div>
    </div>
  )

  const receiveFooter = (
    <div className="flex items-center justify-between">
      <button
        type="button"
        className="flex items-center gap-2 text-sm font-bold text-muted hover:text-fg/80"
      >
        <span className="font-normal text-xs">{walletLabel}</span>
        <ChevronDown className="h-[18px] w-[18px] text-fg/60" strokeWidth={2} aria-hidden />
      </button>
      <div className="text-xs font-bold text-fg/70">0</div>
    </div>
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="grid h-9 w-9 place-items-center rounded-full border border-border bg-surface/40 text-fg/80 hover:bg-surface/60"
          aria-label="Back"
        >
          <ChevronLeft className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
        </button>
        <div className="text-base font-extrabold">Swap</div>
        <div className="w-9" />
      </div>

      {/* <div className="mt-5 flex items-center justify-between">
        <div className="text-sm font-bold text-muted">Use Exchange Balance</div>
        <Toggle checked={useExchangeBalance} onChange={(v) => setUseExchangeBalance(v)} />
      </div> */}

      <div className="mt-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-normal text-fg/80">Pay</div>
          <div className="flex items-center gap-1">
            <div className="text-xs font-normal text-fg/80">Use Exchange Balance</div>
            <ToggleSwitch checked={useExchangeBalance} onChange={(v) => setUseExchangeBalance(v)} />
          </div>
        </div>
        <SwapCard
          token={payToken}
          rightTop={
            <input
              inputMode="decimal"
              value={payAmount}
              onChange={(e) => {
                setPayAmount(e.target.value)
                if (approved) setApproved(false)
              }}
              placeholder="0.00"
              className={[
                'w-[120px] bg-transparent text-right text-base font-semibold tracking-tight text-fg outline-none',
                'placeholder:text-fg/40',
              ].join(' ')}
            />
          }
          rightBottom={payUsdApprox}
          footer={cardFooterTop}
        />

        <div className="relative mt-2 pt-4">
          <button
            type="button"
            aria-label="Swap direction"
            onClick={() => {
              setApproved(false)
              setPayTokenId(receiveTokenId)
              setReceiveTokenId(payTokenId)
            }}
            className={[
              'absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2',
              'grid h-14 w-14 place-items-center rounded-full bg-primary text-black shadow-soft',
              'hover:brightness-95 active:brightness-90',
            ].join(' ')}
          >
            <img src={swapIconUrl} alt="" className="h-5 w-5" />
          </button>

          {/* <div className="flex items-center justify-between pb-2">
            <div className="text-xs font-normal text-fg/80">Receive</div>
            <div className="w-10" />
          </div> */}
          <SwapCard
            token={receiveToken}
            rightTop={effectiveQuote ? effectiveQuote.receiveAmountLine : '--'}
            rightBottom={effectiveQuote ? effectiveQuote.receiveUsdApproxLine : '≈ --'}
            footer={receiveFooter}
          />
        </div>
      </div>

      {approved && effectiveQuote ? (
        <div className="mt-4 space-y-3">
          <SectionCard className="bg-surface/30">
            <div className="space-y-3">
              <KeyValueRow
                label="Route"
                value={
                  <span className="flex items-center gap-2">
                    {effectiveQuote.provider}
                    <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs font-extrabold text-primary">
                      Recommend
                    </span>
                  </span>
                }
              />
              <KeyValueRow label="Rate" value={effectiveQuote.rateLine} />
              <KeyValueRow label="Slippage" value={effectiveQuote.slippageLine} />
              <KeyValueRow label="Min. Received" value={effectiveQuote.minReceivedLine} />
              <KeyValueRow label="Network Fee" value={effectiveQuote.networkFeeLine} />
            </div>
          </SectionCard>
        </div>
      ) : null}

      <div className={['mt-auto pt-5', surface === 'sidepanel' ? 'pb-0' : ''].join(' ')}>
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
            'h-12 w-full rounded-full text-base font-extrabold shadow-soft transition-colors',
            canApprove
              ? 'bg-primary text-black hover:brightness-95 active:brightness-90'
              : 'bg-surface/60 text-muted',
          ].join(' ')}
        >
          {approved ? 'Approved Swap' : 'Swap'}
        </button>
      </div>
    </div>
  )
}
