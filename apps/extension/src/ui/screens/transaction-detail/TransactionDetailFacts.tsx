import React from 'react'

import { TransactionDetailFactRow } from './TransactionDetailFactRow'

function shortenAddr(addr: string): string {
  if (addr.length <= 12) return addr
  return `${addr.slice(0, 5)}...${addr.slice(-4)}`
}

export function TransactionDetailFacts({
  dateLabel,
  from,
  to,
  networkFee,
  blockNumber,
  networkLabel,
}: {
  dateLabel: string
  from: string
  to: string
  networkFee: string
  blockNumber: string
  networkLabel: string
}) {
  return (
    <div className="mt-4 rounded-[16px] bg-[#161616] px-4">
      <TransactionDetailFactRow label="Date" value={dateLabel} />
      <TransactionDetailFactRow label="From" value={shortenAddr(from)} copyable />
      <TransactionDetailFactRow label="To" value={shortenAddr(to)} copyable />
      <TransactionDetailFactRow label="Network Fee" value={networkFee} />
      <TransactionDetailFactRow label="Block Number" value={blockNumber} />
      <TransactionDetailFactRow label="Network" value={networkLabel} isLast />
    </div>
  )
}
