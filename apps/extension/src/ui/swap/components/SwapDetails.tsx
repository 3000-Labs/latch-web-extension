import React from 'react'

import chevronRightIconUrl from 'url:../../../../assets/home/icon-chevron-right.svg'
import swapIconUrl from 'url:../../../../assets/home/icon-swap-action.svg'
import type { SwapQuoteVm } from '../swapVm'

function DetailLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-xs font-normal tracking-[-0.24px] text-[#b3b3b3]">{children}</span>
}

function DetailValue({ children }: { children: React.ReactNode }) {
  return <span className="text-xs font-medium tracking-[-0.12px] text-[#fcfcfc]">{children}</span>
}

function RecommendPill() {
  return (
    <span className="flex h-6 items-center justify-center rounded-lg bg-[rgba(255,173,0,0.08)] px-2 py-1 text-xs font-medium tracking-[-0.12px] text-primary">
      Recommend
    </span>
  )
}

export function SwapDetails({ quote }: { quote: SwapQuoteVm }) {
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <DetailLabel>Route</DetailLabel>
        <button
          type="button"
          className="flex items-center gap-1 transition-opacity hover:opacity-80"
        >
          <DetailValue>{quote.provider}</DetailValue>
          <RecommendPill />
          <img src={chevronRightIconUrl} alt="" className="size-4 shrink-0" aria-hidden />
        </button>
      </div>

      <div className="flex items-center justify-between">
        <DetailLabel>Rate</DetailLabel>
        <div className="flex items-center gap-1">
          <DetailValue>{quote.rateLine}</DetailValue>
          <button type="button" className="shrink-0 transition-opacity hover:opacity-80">
            <img src={swapIconUrl} alt="" className="size-4" aria-hidden />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <DetailLabel>Slippage</DetailLabel>
        <button
          type="button"
          className="flex items-center gap-1 transition-opacity hover:opacity-80"
        >
          <DetailValue>{quote.slippageLine}</DetailValue>
          <img src={chevronRightIconUrl} alt="" className="size-4 shrink-0" aria-hidden />
        </button>
      </div>

      <div className="flex items-center justify-between">
        <DetailLabel>Min. Received</DetailLabel>
        <DetailValue>{quote.minReceivedLine}</DetailValue>
      </div>

      <div className="flex items-center justify-between">
        <DetailLabel>Network Fee</DetailLabel>
        <DetailValue>{quote.networkFeeLine}</DetailValue>
      </div>
    </div>
  )
}
