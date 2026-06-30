import React from 'react'

function formatSwapAmountLine(amount: string, symbol: string): string {
  const trimmed = amount.trim()
  if (!trimmed) return `0 ${symbol}`
  return `${trimmed} ${symbol}`
}

function formatReceiveAmountLine(amount: number, symbol: string): string {
  const trimmed = amount
    .toFixed(8)
    .replace(/(\.\d*?[1-9])0+$/, '$1')
    .replace(/\.0+$/, '')
  return `${trimmed} ${symbol}`
}

export function SwapSuccessMessage({
  payAmount,
  paySymbol,
  receiveAmount,
  receiveSymbol,
}: {
  payAmount: string
  paySymbol: string
  receiveAmount: number
  receiveSymbol: string
}) {
  const payLine = formatSwapAmountLine(payAmount, paySymbol)
  const receiveLine = formatReceiveAmountLine(receiveAmount, receiveSymbol)

  return (
    <div className="flex w-full flex-col items-center gap-3 text-center">
      <h2 className="w-full text-[26px] font-medium leading-[1.32] tracking-[-0.52px] text-[#fcfcfc]">
        Swap Successful!
      </h2>
      <div className="w-full text-[18px] leading-[1.36] tracking-[-0.36px] text-[#b3b3b3]">
        <p>You successfully swapped</p>
        <p>
          <span className="font-bold text-[#fcfcfc]">{payLine}</span>
          <span> for </span>
          <span className="font-bold text-[#fcfcfc]">{receiveLine}.</span>
        </p>
      </div>
    </div>
  )
}

export function SwapFailureMessage({
  payAmount,
  paySymbol,
  receiveAmount,
  receiveSymbol,
}: {
  payAmount: string
  paySymbol: string
  receiveAmount: number
  receiveSymbol: string
}) {
  const payLine = formatSwapAmountLine(payAmount, paySymbol)
  const receiveLine = formatReceiveAmountLine(receiveAmount, receiveSymbol)

  return (
    <div className="flex w-full flex-col items-center gap-2 text-center">
      <h2 className="w-full text-[26px] font-medium leading-[1.32] tracking-[-0.52px] text-[#fcfcfc]">
        Swap Not Successful!
      </h2>
      <p className="w-full text-[18px] font-normal leading-[1.36] tracking-[-0.36px] text-[#b3b3b3]">
        <span>Failed to swap </span>
        <span className="font-bold text-[#fcfcfc]">{payLine} </span>
        <span>for </span>
        <span className="font-bold text-[#fcfcfc]">{receiveLine}.</span>
      </p>
    </div>
  )
}
