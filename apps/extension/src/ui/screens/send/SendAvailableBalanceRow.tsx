import React from 'react'

export function SendAvailableBalanceRow({
  balance,
  symbol,
  onMax,
}: {
  balance: string
  symbol: string
  onMax: () => void
}) {
  return (
    <div className="flex shrink-0 items-end justify-between gap-3 mt-6 px-1">
      <div>
        <div className="text-[13px] text-[#8E8E93] mb-1">Available To Send</div>
        <div className="text-[15px] font-bold text-white">
          {balance} {symbol}
        </div>
      </div>
      <button
        type="button"
        onClick={onMax}
        className="rounded-[10px] bg-[#333333] px-5 py-2 text-[13px] font-semibold text-white hover:bg-[#444444] transition-colors"
      >
        Max
      </button>
    </div>
  )
}
