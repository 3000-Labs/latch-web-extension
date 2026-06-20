import React, { useMemo } from 'react'

import {
  cryptoToFiat,
  fiatToCrypto,
  hasValidDecimalPlaces,
  isAmountWithinBalance,
  parsePositiveAmount,
} from '../../lib/sendAmount'
import type { SendDraft, SendInputMode } from '../../types/send'
import { SendAmountDisplay } from './SendAmountDisplay'
import { SendAvailableBalanceRow } from './SendAvailableBalanceRow'
import { SendEnterAmountHeader } from './SendEnterAmountHeader'
import { SendQuickAmountButtons } from './SendQuickAmountButtons'
import { SendRecipientBar } from './SendRecipientBar'

export function SendEnterAmountScreen({
  draft,
  priceUsd,
  onDraftChange,
  onBack,
  onEditRecipient,
  onNext,
}: {
  surface: 'popup' | 'sidepanel'
  draft: SendDraft
  priceUsd: number | null
  onDraftChange: (patch: Partial<SendDraft>) => void
  onBack: () => void
  onEditRecipient: () => void
  onNext: () => void
}) {
  const token = draft.token!
  const cryptoAmount = useMemo(() => {
    if (draft.inputMode === 'crypto') return draft.amount
    return fiatToCrypto(draft.amount, priceUsd) ?? ''
  }, [draft.amount, draft.inputMode, priceUsd])

  const canContinue = useMemo(() => {
    const n = parsePositiveAmount(cryptoAmount)
    if (n == null) return false
    if (!hasValidDecimalPlaces(cryptoAmount, token.decimals)) return false
    return isAmountWithinBalance(String(n), token.amount)
  }, [cryptoAmount, token.amount, token.decimals])

  const handlePresetUsd = (usd: number) => {
    onDraftChange({ amount: String(usd), inputMode: 'fiat' as SendInputMode })
  }

  const handleMax = () => {
    onDraftChange({ amount: token.amount, inputMode: 'crypto' })
  }

  const toggleMode = () => {
    if (draft.inputMode === 'crypto') {
      const fiat = cryptoToFiat(draft.amount || '0', priceUsd)
      onDraftChange({
        inputMode: 'fiat',
        amount: draft.amount && fiat ? fiat : '',
      })
    } else {
      const crypto = fiatToCrypto(draft.amount || '0', priceUsd)
      onDraftChange({
        inputMode: 'crypto',
        amount: draft.amount && crypto ? crypto : '',
      })
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5 animate-screenIn">
      <SendEnterAmountHeader
        title={`Select ${token.code}`}
        canContinue={canContinue}
        onBack={onBack}
        onNext={onNext}
      />

      <SendRecipientBar
        recipientName={draft.recipientName}
        recipientAddress={draft.recipientAddress}
        onEdit={onEditRecipient}
      />

      <div className="flex min-h-0 flex-1 flex-col justify-between gap-6">
        <div className="flex flex-col items-center gap-4">
          <SendAmountDisplay
            amount={draft.amount}
            inputMode={draft.inputMode}
            symbol={token.code}
            priceUsd={priceUsd}
            onAmountChange={(amount) => onDraftChange({ amount })}
            onToggleMode={toggleMode}
          />
          <SendQuickAmountButtons onSelect={handlePresetUsd} />
        </div>

        <SendAvailableBalanceRow balance={token.amount} symbol={token.code} onMax={handleMax} />
      </div>
    </div>
  )
}
