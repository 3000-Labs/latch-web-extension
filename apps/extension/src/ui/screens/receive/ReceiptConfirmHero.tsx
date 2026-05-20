import React from 'react'

export function ReceiptConfirmHero({
  amount,
  symbol,
}: {
  amount: string
  symbol: string
}) {
  return (
    <div className="text-center py-8 mt-12">
      <div className="text-[13px] font-bold text-muted uppercase tracking-wider">
        Amount Received
      </div>
      <div className="text-[38px] font-extrabold tracking-tight text-fg mt-2">
        {amount}
        <span className="font-extrabold">{symbol.toLowerCase()}</span>
      </div>
    </div>
  )
}
