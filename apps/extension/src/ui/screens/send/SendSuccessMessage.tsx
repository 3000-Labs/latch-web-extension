import React from 'react'

import { truncateMiddle } from '../../lib/sendAddress'
import { formatSummaryAmountLine } from './SendSummaryHero'

export function SendSuccessMessage({
  amount,
  symbol,
  recipientName,
  recipientAddress,
}: {
  amount: string
  symbol: string
  recipientName?: string
  recipientAddress: string
}) {
  const amountLine = formatSummaryAmountLine(amount, symbol)
  const recipientLabel = recipientName
    ? `${recipientName} {${truncateMiddle(recipientAddress)}}`
    : `{${truncateMiddle(recipientAddress)}}`

  return (
    <div className="flex w-full flex-col items-center gap-2 text-center">
      <h2 className="w-full text-[22px] font-medium leading-[1.32] tracking-[-0.44px] text-[#fcfcfc]">
        Token Sent!
      </h2>
      <p className="w-full text-[16px] font-normal leading-[1.36] tracking-[-0.32px] text-[#b3b3b3]">
        <span className="font-bold text-[#fcfcfc]">{amountLine}</span>
        <span> was successfully sent to </span>
        <span className="font-bold text-[#fcfcfc]">{recipientLabel}</span>
      </p>
    </div>
  )
}
