import React from 'react'

import type { SendDraft } from '../../types/send'
import { fiatToCrypto } from '../../lib/sendAmount'
import { SendFailureIllustration } from './SendFailureIllustration'
import { SendFailureMessage } from './SendFailureMessage'
import { SendTryAgainButton } from './SendTryAgainButton'

export function SendFailureScreen({
  surface,
  draft,
  errorDetail,
  onTryAgain,
}: {
  surface: 'popup' | 'sidepanel'
  draft: SendDraft
  errorDetail?: string
  onTryAgain: () => void
}) {
  const token = draft.token!
  const cryptoAmount =
    draft.inputMode === 'crypto' ? draft.amount : (fiatToCrypto(draft.amount, token.code) ?? draft.amount)

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center">
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center">
        <SendFailureIllustration />
        <SendFailureMessage
          amount={cryptoAmount}
          symbol={token.code}
          recipientName={draft.recipientName}
          recipientAddress={draft.recipientAddress}
          errorDetail={errorDetail}
        />
      </div>
      <div className={['w-full shrink-0', surface === 'sidepanel' ? 'pb-0' : 'pb-2'].join(' ')}>
        <SendTryAgainButton onTryAgain={onTryAgain} />
      </div>
    </div>
  )
}
