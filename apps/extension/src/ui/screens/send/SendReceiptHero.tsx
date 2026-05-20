import React from 'react'

export function SendReceiptHero({ amount, symbol }: { amount: string; symbol: string }) {
  return (
    <div className="mt-6 text-center">
      <div className="text-xs font-bold text-muted">Amount Sent</div>
      <div className="mt-2 text-[40px] font-extrabold leading-tight tracking-tight text-fg">
        {amount}
        {symbol}
      </div>
    </div>
  )
}
