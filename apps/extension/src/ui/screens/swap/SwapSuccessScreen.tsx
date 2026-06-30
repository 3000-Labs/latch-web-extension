import React from 'react'

import { OnboardingSmallEmblem } from '../../onboarding/components/OnboardingSmallEmblem'
import { SendContinueButton } from '../send/SendContinueButton'
import { SendSuccessIllustration } from '../send/SendSuccessIllustration'
import type { SwapDraft, SwapQuoteVm, SwapTokenVm } from '../../swap/swapVm'
import { SwapResultHeader } from './components/SwapResultHeader'
import { SwapSuccessMessage } from './components/SwapResultMessage'

export function SwapSuccessScreen({
  draft,
  quote,
  resolveSwapToken,
  onBackToHome,
}: {
  draft: SwapDraft
  quote: SwapQuoteVm
  resolveSwapToken: (id: string) => SwapTokenVm | undefined
  onBackToHome: () => void
}) {
  const payToken = resolveSwapToken(draft.payTokenId) ?? quote.quotePayload.assetIn
  const receiveToken = resolveSwapToken(draft.receiveTokenId) ?? quote.quotePayload.assetOut

  return (
    <div className="flex min-h-0 flex-1 flex-col animate-screenIn">
      <SwapResultHeader onBack={onBackToHome} />
      <div className="mt-6 flex min-h-0 flex-1 flex-col justify-between">
        <div className="flex w-full flex-col items-center gap-6">
          <OnboardingSmallEmblem />
          <div className="flex w-full flex-col items-center gap-6">
            <SendSuccessIllustration />
            <SwapSuccessMessage
              payAmount={draft.payAmount}
              paySymbol={payToken?.symbol ?? ''}
              receiveAmount={quote.receiveAmount}
              receiveSymbol={receiveToken?.symbol ?? ''}
            />
          </div>
        </div>
        <SendContinueButton onContinue={onBackToHome} />
      </div>
    </div>
  )
}
