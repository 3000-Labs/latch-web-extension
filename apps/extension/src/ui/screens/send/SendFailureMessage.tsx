import React from 'react'

import { truncateMiddle } from '../../lib/sendAddress'

export function SendFailureMessage({
  amount,
  symbol,
  recipientName,
  recipientAddress,
  errorDetail,
}: {
  amount: string
  symbol: string
  recipientName?: string
  recipientAddress: string
  errorDetail?: string
}) {
  const recipientLabel = recipientName
    ? `${recipientName} {${truncateMiddle(recipientAddress)}}`
    : `{${truncateMiddle(recipientAddress)}}`

  return (
    <div className="mt-8 px-4 text-center">
      <h2 className="text-2xl font-extrabold tracking-tight text-fg">Token Not Sent!</h2>
      <p className="mt-4 text-sm leading-relaxed">
        <span className="font-extrabold text-fg">
          {amount}
          {symbol}
        </span>
        <span className="font-bold text-muted"> failed to send to </span>
        <span className="font-extrabold text-fg">{recipientLabel}</span>
      </p>
      {errorDetail ? (
        <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-left text-xs font-bold leading-relaxed text-red-300">
          {errorDetail}
        </p>
      ) : null}
    </div>
  )
}
