import React, { useEffect, useMemo, useState } from 'react'

import type { BuildSendTxResponse } from '@latch/types'

import { fiatToCrypto } from '../../lib/sendAmount'
import type { SendDraft } from '../../types/send'
import { SendSummaryFacts } from './SendSummaryFacts'
import { SendSummaryHeader } from './SendSummaryHeader'
import { SendSummaryHero } from './SendSummaryHero'
import { SendSummarySubmitButton } from './SendSummarySubmitButton'

export function SendSummaryScreen({
  surface,
  draft,
  networkLabel,
  sendProgressLabel,
  sendError,
  onBack,
  onSend,
  onFetchFeeEstimate,
}: {
  surface: 'popup' | 'sidepanel'
  draft: SendDraft
  networkLabel: string
  sendProgressLabel: string | null
  sendError: string | null
  onBack: () => void
  onSend: () => void
  onFetchFeeEstimate: () => Promise<BuildSendTxResponse | null>
}) {
  const token = draft.token!
  const cryptoAmount = useMemo(() => {
    if (draft.inputMode === 'crypto') return draft.amount
    return fiatToCrypto(draft.amount, token.code) ?? '0'
  }, [draft.amount, draft.inputMode, token.code])

  const [feeDisplay, setFeeDisplay] = useState('Fast | —')

  useEffect(() => {
    let cancelled = false
    void onFetchFeeEstimate().then((res) => {
      if (cancelled || !res) return
      const label = res.feeLabel ?? 'Fast'
      const xlm = res.estimatedFeeXlm ?? '—'
      const usd = res.estimatedFeeUsd ? ` ($${res.estimatedFeeUsd})` : ''
      setFeeDisplay(`${label} | ${xlm} XLM${usd}`)
    })
    return () => {
      cancelled = true
    }
  }, [onFetchFeeEstimate])

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SendSummaryHeader onBack={onBack} />
      <div className="min-h-0 flex-1 overflow-auto">
        <SendSummaryHero amount={cryptoAmount} symbol={token.code} assetCode={token.code} />
        <SendSummaryFacts
          recipientName={draft.recipientName}
          recipientAddress={draft.recipientAddress}
          networkLabel={networkLabel}
          feeDisplay={feeDisplay}
        />
        {sendError ? (
          <div className="mt-4 text-center text-sm font-bold text-red-300">{sendError}</div>
        ) : null}
      </div>
      <div className={['mt-4 shrink-0', surface === 'sidepanel' ? 'pb-0' : 'pb-2'].join(' ')}>
        <SendSummarySubmitButton progressLabel={sendProgressLabel} onSend={onSend} />
      </div>
    </div>
  )
}
