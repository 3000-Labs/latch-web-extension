import React from 'react'

import { truncateMiddle } from '../../lib/sendAddress'
import type { SendDraft, SendResult } from '../../types/send'
import { fiatToCrypto } from '../../lib/sendAmount'
import { SendReceiptFactRow } from './SendReceiptFactRow'
import { SendReceiptHero } from './SendReceiptHero'
import { SendReceiptTryAgainButton } from './SendReceiptTryAgainButton'

function formatReceiptDate(iso?: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export function SendReceiptScreen({
  surface,
  draft,
  result,
  onTryAgain,
}: {
  surface: 'popup' | 'sidepanel'
  draft: SendDraft
  result: SendResult
  onTryAgain: () => void
}) {
  const token = draft.token!
  const cryptoAmount =
    draft.inputMode === 'crypto'
      ? draft.amount
      : (fiatToCrypto(draft.amount, token.code) ?? draft.amount)
  const recipientLabel = draft.recipientName
    ? `${draft.recipientName} {${truncateMiddle(draft.recipientAddress)}}`
    : `{${truncateMiddle(draft.recipientAddress)}}`
  const confirmed = result.status === 'success'

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-auto">
        <SendReceiptHero amount={cryptoAmount} symbol={token.code} />
        <div className="mt-8 divide-y divide-border border-t border-border px-1">
          <SendReceiptFactRow label="Wallet Address" value={recipientLabel} />
          <SendReceiptFactRow label="Transaction Hash" value={result.hash ?? '—'} />
          <SendReceiptFactRow
            label="Status"
            value={confirmed ? 'Confirmed' : 'Failed'}
            valueClassName={confirmed ? 'text-green-400' : 'text-red-300'}
          />
          <SendReceiptFactRow label="Date" value={formatReceiptDate(result.submittedAt)} />
        </div>
      </div>
      <div className={['mt-4 shrink-0', surface === 'sidepanel' ? 'pb-0' : 'pb-2'].join(' ')}>
        <SendReceiptTryAgainButton onTryAgain={onTryAgain} />
      </div>
    </div>
  )
}
