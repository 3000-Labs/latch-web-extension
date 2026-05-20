import React, { useMemo } from 'react'

import {
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
  surface,
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
    const nextMode: SendInputMode = draft.inputMode === 'crypto' ? 'fiat' : 'crypto'
    onDraftChange({ inputMode: nextMode, amount: '' })
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
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
      <SendAmountDisplay
        amount={draft.amount}
        inputMode={draft.inputMode}
        symbol={token.code}
        priceUsd={priceUsd}
        onAmountChange={(amount) => onDraftChange({ amount })}
        onToggleMode={toggleMode}
      />
      <div
        className={['mt-4 shrink-0 space-y-4', surface === 'sidepanel' ? 'pb-0' : 'pb-2'].join(' ')}
      >
        <SendQuickAmountButtons onSelect={handlePresetUsd} />
        <SendAvailableBalanceRow balance={token.amount} symbol={token.code} onMax={handleMax} />
      </div>
    </div>
  )
}
