import React from 'react'

import { FullScreenLoaderOverlay } from '../../components/FullScreenLoaderOverlay'
import { truncateMiddle } from '../../lib/sendAddress'
import { formatSummaryAmountLine } from './SendSummaryHero'

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
  const amountLabel = formatSummaryAmountLine(amount, symbol)
  const addressLabel = `{${truncateMiddle(recipientAddress, 6, 4)}}`
  const recipient = recipientName?.trim() ? `${recipientName.trim()} ${addressLabel}` : addressLabel

  return (
    <FullScreenLoaderOverlay label="Sending..." description={`${amountLabel} to ${recipient}`} />
  )
}
