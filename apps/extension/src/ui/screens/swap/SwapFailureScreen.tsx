import React from 'react'

import { OnboardingSmallEmblem } from '../../onboarding/components/OnboardingSmallEmblem'
import { SendTryAgainButton } from '../send/SendTryAgainButton'
import { SendFailureIllustration } from '../send/SendFailureIllustration'
import type { SwapDraft, SwapQuoteVm, SwapTokenVm } from '../../swap/swapVm'
import { SwapResultHeader } from './components/SwapResultHeader'
import { SwapFailureMessage } from './components/SwapResultMessage'

export function SwapFailureScreen({
  draft,
  quote,
  resolveSwapToken,
  errorDetail,
  onBack,
  onTryAgain,
}: {
  draft: SwapDraft
  quote: SwapQuoteVm
  resolveSwapToken: (id: string) => SwapTokenVm | undefined
  errorDetail?: string | null
  onBack: () => void
  onTryAgain: () => void
}) {
  const payToken = resolveSwapToken(draft.payTokenId) ?? quote.quotePayload.assetIn
  const receiveToken = resolveSwapToken(draft.receiveTokenId) ?? quote.quotePayload.assetOut

  return (
    <div className="flex min-h-0 flex-1 flex-col animate-screenIn">
      <SwapResultHeader onBack={onBack} />
      <div className="mt-6 flex min-h-0 flex-1 flex-col justify-between">
        <div className="flex w-full flex-col items-center gap-6">
          <OnboardingSmallEmblem />
          <div className="flex w-full flex-col items-center gap-6">
            <SendFailureIllustration />
            <SwapFailureMessage
              payAmount={draft.payAmount}
              paySymbol={payToken?.symbol ?? ''}
              receiveAmount={quote.receiveAmount}
              receiveSymbol={receiveToken?.symbol ?? ''}
              detail={errorDetail}
            />
          </div>
        </div>
        <SendTryAgainButton onTryAgain={onTryAgain} />
      </div>
    </div>
  )
}
