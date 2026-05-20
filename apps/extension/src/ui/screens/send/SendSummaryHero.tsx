import React from 'react'

import { cryptoToFiat } from '../../lib/sendAmount'

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
    <div className="mt-8 text-center">
      <div className="text-[40px] font-extrabold leading-tight tracking-tight text-fg">
        {amount}
        {symbol}
      </div>
      <div className="mt-2 text-sm font-bold text-muted">${fiat ?? '0.00'}</div>
    </div>
  )
}
