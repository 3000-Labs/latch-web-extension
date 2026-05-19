import React from 'react'

import { truncateMiddle } from '../../lib/sendAddress'

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
  const recipientLabel = recipientName
    ? `${recipientName} {${truncateMiddle(recipientAddress)}}`
    : `{${truncateMiddle(recipientAddress)}}`

  return (
    <div className="mt-8 px-4 text-center">
      <h2 className="text-2xl font-extrabold tracking-tight text-fg">Token Sent!</h2>
      <p className="mt-4 text-sm leading-relaxed">
        <span className="font-extrabold text-fg">
          {amount}
          {symbol}
        </span>
        <span className="font-bold text-muted"> was successfully sent to </span>
        <span className="font-extrabold text-fg">{recipientLabel}</span>
      </p>
    </div>
  )
}
