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
  network = 'testnet',
  onContinue,
  onViewReceipt,
}: {
  surface: 'popup' | 'sidepanel'
  draft: SendDraft
  result: SendResult
  priceUsd: number | null
  network?: import('@latch/types').Network
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
            {result.proposalId ? (
              <div className="flex w-full flex-col items-center gap-2 text-center">
                <h2 className="w-full text-[22px] font-medium leading-[1.32] tracking-[-0.44px] text-[#fcfcfc]">
                  Proposal created
                </h2>
                <p className="w-full text-[16px] font-normal leading-[1.36] tracking-[-0.32px] text-[#b3b3b3]">
                  Co-owners must approve before this send can execute. You can approve now from the
                  proposal screen.
                </p>
              </div>
            ) : (
              <SendSuccessMessage
                amount={cryptoAmount}
                symbol={token.code}
                recipientName={draft.recipientName}
                recipientAddress={draft.recipientAddress}
              />
            )}
            {result.hash && !result.proposalId ? (
              <SendViewTransactionLink
                hash={result.hash}
                network={network}
                onView={onViewReceipt}
              />
            ) : null}
          </div>
        </div>

        <SendContinueButton onContinue={onContinue} />
      </div>
    </div>
  )
}
