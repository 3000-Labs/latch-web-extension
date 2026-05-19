import React from 'react'

import type { SmartAccountBalanceRow } from '@latch/types'

import { TokenAvatar } from '../../components/TokenAvatar'
import { tokenDisplayName } from '../../lib/sendAddress'

export function SendTokenCard({
  token,
  onSelect,
}: {
  token: SmartAccountBalanceRow
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full items-center gap-3 rounded-2xl border border-border bg-surface/40 px-4 py-4 text-left hover:bg-surface/60"
    >
      <TokenAvatar symbol={token.code} iconUrl={token.iconUrl} />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-extrabold">{tokenDisplayName(token.code)}</div>
        <div className="mt-0.5 text-xs font-bold uppercase text-muted">
          BALANCE {token.amount} {token.code}
        </div>
      </div>
    </button>
  )
}
