import React from 'react'

import type { SendDraft, SendResult } from '../../types/send'
import { fiatToCrypto } from '../../lib/sendAmount'
import { SendContinueButton } from './SendContinueButton'
import { SendSuccessIllustration } from './SendSuccessIllustration'
import { SendSuccessMessage } from './SendSuccessMessage'
import { SendViewTransactionLink } from './SendViewTransactionLink'

export function SendSuccessScreen({
  surface,
  draft,
  result,
  onContinue,
  onViewReceipt,
}: {
  surface: 'popup' | 'sidepanel'
  draft: SendDraft
  result: SendResult
  onContinue: () => void
  onViewReceipt: () => void
}) {
  const token = draft.token!
  const cryptoAmount =
    draft.inputMode === 'crypto' ? draft.amount : (fiatToCrypto(draft.amount, token.code) ?? draft.amount)

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center">
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center">
        <SendSuccessIllustration />
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
      <div className={['w-full shrink-0', surface === 'sidepanel' ? 'pb-0' : 'pb-2'].join(' ')}>
        <SendContinueButton onContinue={onContinue} />
      </div>
    </div>
  )
}
