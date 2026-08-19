import React, { useMemo } from 'react'

import type { SmartAccountBalanceRow } from '@latch/types'

import { tokenDisplayName } from '../../lib/sendAddress'
import { SendTokenCard } from './SendTokenCard'

function hasPositiveBalance(amount: string): boolean {
  const n = parseFloat(amount)
  return Number.isFinite(n) && n > 0
}

export function SendTokenList({
  tokens,
  search,
  loading,
  error,
  onSelect,
}: {
  tokens: SmartAccountBalanceRow[]
  search: string
  loading: boolean
  error: string | null
  onSelect: (token: SmartAccountBalanceRow) => void
}) {
  const filtered = useMemo(() => {
    const withBalance = tokens.filter((t) => hasPositiveBalance(t.amount))
    const q = search.trim().toLowerCase()
    if (!q) return withBalance
    return withBalance.filter((t) => {
      const name = tokenDisplayName(t.code).toLowerCase()
      const code = t.code.toLowerCase()
      return name.includes(q) || code.includes(q)
    })
  }, [tokens, search])

  if (loading) {
    return (
      <div className="py-12 text-center text-sm tracking-[-0.28px] text-muted">
        Loading balances…
      </div>
    )
  }

  if (error) {
    return <div className="py-12 text-center text-sm tracking-[-0.28px] text-red-300">{error}</div>
  }

  if (filtered.length === 0) {
    return (
      <div className="py-12 text-center text-sm tracking-[-0.28px] text-muted">
        {search.trim() ? `No tokens match "${search}"` : 'No tokens available to send'}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 pb-6">
      {filtered.map((token) => (
        <SendTokenCard key={token.sacContractId} token={token} onSelect={() => onSelect(token)} />
      ))}
    </div>
  )
}
