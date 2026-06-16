import React from 'react'

import type { SendDraft } from '../../types/send'
import { fiatToCrypto } from '../../lib/sendAmount'
import { SendFailureIllustration } from './SendFailureIllustration'
import { SendFailureMessage } from './SendFailureMessage'
import { SendTryAgainButton } from './SendTryAgainButton'

export function SendFailureScreen({
  draft,
  priceUsd,
  onTryAgain,
}: {
  surface: 'popup' | 'sidepanel'
  draft: SendDraft
  errorDetail?: string
  priceUsd: number | null
  onTryAgain: () => void
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
          <SendFailureIllustration />
          <SendFailureMessage
            amount={cryptoAmount}
            symbol={token.code}
            recipientName={draft.recipientName}
            recipientAddress={draft.recipientAddress}
          />
        </div>

        <SendTryAgainButton onTryAgain={onTryAgain} />
      </div>
    </div>
  )
}
