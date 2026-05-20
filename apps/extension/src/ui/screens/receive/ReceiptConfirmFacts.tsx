import React from 'react'
import { ReceiptConfirmFactRow } from './ReceiptConfirmFactRow'

export function ReceiptConfirmFacts({
  date,
  status,
  fromAddress,
  network,
}: {
  date: string
  status: string
  fromAddress: string
  network: string
}) {
  const isSucceeded = status.toLowerCase() === 'succeeded'

  return (
    <div className="space-y-1 my-8">
      <ReceiptConfirmFactRow label="Date" value={date} />

      <ReceiptConfirmFactRow
        label="Status"
        value={status}
        valueClassName={isSucceeded ? 'text-green-500' : 'text-fg'}
      />

      <ReceiptConfirmFactRow label="From" value={fromAddress} />

      <ReceiptConfirmFactRow label="Network" value={network} />
    </div>
  )
}
