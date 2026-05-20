import React from 'react'
import { ReceiptConfirmHero } from './ReceiptConfirmHero'
import { ReceiptConfirmFacts } from './ReceiptConfirmFacts'
import { ReceiptConfirmCloseButton } from './ReceiptConfirmCloseButton'

export function ReceiptConfirmScreen({
  amount,
  symbol,
  date,
  status,
  fromAddress,
  network,
  onClose,
}: {
  amount: string
  symbol: string
  date: string
  status: string
  fromAddress: string
  network: string
  onClose: () => void
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col animate-screenIn justify-between pb-6">
      <div>
        <ReceiptConfirmHero amount={amount} symbol={symbol} />
        <ReceiptConfirmFacts
          date={date}
          status={status}
          fromAddress={fromAddress}
          network={network}
        />
      </div>
      
      <div className="shrink-0 mt-8">
        <ReceiptConfirmCloseButton onClick={onClose} />
      </div>
    </div>
  )
}
