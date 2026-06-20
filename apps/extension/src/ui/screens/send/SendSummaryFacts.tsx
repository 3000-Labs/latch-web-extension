import React from 'react'

import { truncateMiddle } from '../../lib/sendAddress'
import { SendSummaryFactRow } from './SendSummaryFactRow'

function RecipientSummaryValue({
  recipientName,
  recipientAddress,
}: {
  recipientName?: string
  recipientAddress: string
}) {
  const addressLabel = `{${truncateMiddle(recipientAddress, 6, 4)}}`

  if (!recipientName) {
    return <span className="truncate">{addressLabel}</span>
  }

  return (
    <span className="truncate">
      <span>{recipientName}</span>
      <span className="font-normal">{` ${addressLabel}`}</span>
    </span>
  )
}

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
  return (
    <div className="flex w-full flex-col gap-4">
      <SendSummaryFactRow
        label="To"
        value={
          <RecipientSummaryValue
            recipientName={recipientName}
            recipientAddress={recipientAddress}
          />
        }
      />
      <SendSummaryFactRow label="Network" value={networkLabel} />
      <SendSummaryFactRow label="Network Fee" value={feeDisplay} showChevron />
    </div>
  )
}
