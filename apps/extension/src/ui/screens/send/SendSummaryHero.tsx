import React from 'react'

import { cryptoToFiat } from '../../lib/sendAmount'

export function formatSummaryAmountLine(amount: string, symbol: string): string {
  const trimmed = amount.trim()
  if (!trimmed) return `0${symbol}`
  return `${trimmed}${symbol}`
}

export function SendSummaryHero({
  amount,
  symbol,
  priceUsd,
}: {
  amount: string
  symbol: string
  priceUsd: number | null
}) {
  const fiat = cryptoToFiat(amount, priceUsd)

  return (
    <div className="flex h-[190px] w-full flex-col items-center justify-center gap-2 text-center">
      <p className="text-[48px] font-semibold leading-[1.28] tracking-[-1.44px] text-[#fcfcfc]">
        {formatSummaryAmountLine(amount, symbol)}
      </p>
      <p className="text-sm font-normal leading-[1.34] tracking-[-0.28px] text-[#b3b3b3]">
        ${fiat ?? '0.00'}
      </p>
    </div>
  )
}
