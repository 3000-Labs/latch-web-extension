import React from 'react'

import { LatchLoadingMark } from '../../components/LatchLoadingMark'
import { truncateMiddle } from '../../lib/sendAddress'
import { formatSummaryAmountLine } from './SendSummaryHero'

function SendLoadingRecipientLine({
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
  const amountLabel = formatSummaryAmountLine(amount, symbol)
  const addressLabel = `{${truncateMiddle(recipientAddress, 6, 4)}}`

  return (
    <p className="max-w-[265px] text-center text-base leading-[1.31] tracking-[-0.16px] text-[#fbfbfb]">
      <span className="font-semibold">{amountLabel}</span>
      <span className="font-normal tracking-[-0.32px] text-[#b3b3b3]"> to </span>
      {recipientName ? (
        <>
          <span className="font-semibold">{recipientName}</span>
          <span className="font-normal">{` ${addressLabel}`}</span>
        </>
      ) : (
        <span className="font-normal">{addressLabel}</span>
      )}
    </p>
  )
}

export function SendTransactionLoadingOverlay({
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
  return (
    <div
      className="absolute inset-0 z-10 flex items-center justify-center"
      role="status"
      aria-live="polite"
      aria-label="Sending transaction"
    >
      <div className="absolute inset-0 bg-[#121212]/90" aria-hidden />
      <div className="relative flex flex-col items-center gap-2 px-6">
        <LatchLoadingMark />
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-base font-semibold leading-[1.31] tracking-[-0.16px] text-[#fbfbfb]">
            Sending...
          </p>
          <SendLoadingRecipientLine
            amount={amount}
            symbol={symbol}
            recipientName={recipientName}
            recipientAddress={recipientAddress}
          />
        </div>
      </div>
    </div>
  )
}
