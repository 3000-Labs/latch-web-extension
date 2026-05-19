import React from 'react'

import type { BuildSendTxResponse, SmartAccountBalanceRow } from '@latch/types'

import type { SendDraft, SendResult, SendStep } from '../../types/send'
import { SendEnterAmountScreen } from './SendEnterAmountScreen'
import { SendFailureScreen } from './SendFailureScreen'
import { SendReceiptScreen } from './SendReceiptScreen'
import { SendSelectRecipientScreen } from './SendSelectRecipientScreen'
import { SendSelectTokenScreen } from './SendSelectTokenScreen'
import { SendSuccessScreen } from './SendSuccessScreen'
import { SendSummaryScreen } from './SendSummaryScreen'

export function SendFlow({
  surface,
  step,
  draft,
  result,
  portfolioRows,
  portfolioLoading,
  portfolioError,
  networkLabel,
  sendProgressLabel,
  sendError,
  onDraftChange,
  onStepChange,
  onBackFromSend,
  onFetchFeeEstimate,
  onSubmitSend,
  onContinueHome,
  onTryAgainFromFailure,
}: {
  surface: 'popup' | 'sidepanel'
  step: SendStep
  draft: SendDraft
  result: SendResult | null
  portfolioRows: SmartAccountBalanceRow[]
  portfolioLoading: boolean
  portfolioError: string | null
  networkLabel: string
  sendProgressLabel: string | null
  sendError: string | null
  onDraftChange: (patch: Partial<SendDraft>) => void
  onStepChange: (step: SendStep) => void
  onBackFromSend: () => void
  onFetchFeeEstimate: () => Promise<BuildSendTxResponse | null>
  onSubmitSend: () => void
  onContinueHome: () => void
  onTryAgainFromFailure: () => void
}) {
  if (step === 'selectToken') {
    return (
      <SendSelectTokenScreen
        tokens={portfolioRows}
        loading={portfolioLoading}
        error={portfolioError}
        onBack={onBackFromSend}
        onSelectToken={(token) => {
          onDraftChange({ token })
          onStepChange('selectRecipient')
        }}
      />
    )
  }

  if (!draft.token) {
    return null
  }

  if (step === 'selectRecipient') {
    return (
      <SendSelectRecipientScreen
        token={draft.token}
        recipientAddress={draft.recipientAddress}
        onRecipientChange={(address, name) =>
          onDraftChange({ recipientAddress: address, recipientName: name })
        }
        onBack={() => onStepChange('selectToken')}
        onContinue={() => onStepChange('enterAmount')}
      />
    )
  }

  if (step === 'enterAmount') {
    return (
      <SendEnterAmountScreen
        surface={surface}
        draft={draft}
        onDraftChange={onDraftChange}
        onBack={() => onStepChange('selectRecipient')}
        onEditRecipient={() => onStepChange('selectRecipient')}
        onNext={() => onStepChange('summary')}
      />
    )
  }

  if (step === 'summary') {
    return (
      <SendSummaryScreen
        surface={surface}
        draft={draft}
        networkLabel={networkLabel}
        sendProgressLabel={sendProgressLabel}
        sendError={sendError}
        onBack={() => onStepChange('enterAmount')}
        onSend={onSubmitSend}
        onFetchFeeEstimate={onFetchFeeEstimate}
      />
    )
  }

  if (step === 'success' && result) {
    return (
      <SendSuccessScreen
        surface={surface}
        draft={draft}
        result={result}
        onContinue={onContinueHome}
        onViewReceipt={() => onStepChange('receipt')}
      />
    )
  }

  if (step === 'failure') {
    return (
      <SendFailureScreen
        surface={surface}
        draft={draft}
        errorDetail={result?.errorMessage}
        onTryAgain={onTryAgainFromFailure}
      />
    )
  }

  if (step === 'receipt' && result) {
    return (
      <SendReceiptScreen
        surface={surface}
        draft={draft}
        result={result}
        onTryAgain={() => onStepChange('summary')}
      />
    )
  }

  return null
}
