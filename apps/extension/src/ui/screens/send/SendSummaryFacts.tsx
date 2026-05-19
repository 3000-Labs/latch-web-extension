import React from 'react'

import { truncateMiddle } from '../../lib/sendAddress'
import { SendSummaryFactRow } from './SendSummaryFactRow'

export function SendSummaryFacts({
  recipientName,
  recipientAddress,
  networkLabel,
  feeDisplay,
}: {
  recipientName?: string
  recipientAddress: string
  networkLabel: string
  feeDisplay: string
}) {
  const toValue = recipientName
    ? `${recipientName} {${truncateMiddle(recipientAddress)}}`
    : `{${truncateMiddle(recipientAddress)}}`

  return (
    <div className="mt-8 divide-y divide-border border-t border-border">
      <SendSummaryFactRow label="To" value={toValue} />
      <SendSummaryFactRow label="Network" value={networkLabel} />
      <SendSummaryFactRow label="Network Fee" value={feeDisplay} showChevron />
    </div>
  )
}
