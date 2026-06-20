import React from 'react'

import type { SendDraft, SendResult } from '../../types/send'
import { fiatToCrypto } from '../../lib/sendAmount'
import { SendContinueButton } from './SendContinueButton'
import { SendSuccessIllustration } from './SendSuccessIllustration'
import { SendSuccessMessage } from './SendSuccessMessage'
import { SendViewTransactionLink } from './SendViewTransactionLink'

export function SendSuccessScreen({
  draft,
  result,
  priceUsd,
  onContinue,
  onViewReceipt,
}: {
  surface: 'popup' | 'sidepanel'
  draft: SendDraft
  result: SendResult
  priceUsd: number | null
  onContinue: () => void
  onViewReceipt: () => void
}) {
  const token = draft.token!
  const cryptoAmount =
    draft.inputMode === 'crypto'
      ? draft.amount
      : (fiatToCrypto(draft.amount, priceUsd) ?? draft.amount)

  return (
    <div className="flex min-h-0 flex-1 flex-col animate-screenIn">
      <div className="flex min-h-0 flex-1 flex-col justify-between">
        <div className="flex w-full flex-col items-center gap-6">
          <SendSuccessIllustration />

          <div className="flex w-full flex-col items-center gap-3">
            <SendSuccessMessage
              amount={cryptoAmount}
              symbol={token.code}
              recipientName={draft.recipientName}
              recipientAddress={draft.recipientAddress}
            />
            {result.hash ? (
              <SendViewTransactionLink hash={result.hash} onView={onViewReceipt} />
            ) : null}
          </div>
        </div>

        <SendContinueButton onContinue={onContinue} />
      </div>
    </div>
  )
}
