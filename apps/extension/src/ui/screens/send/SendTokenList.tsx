import React, { useMemo } from 'react'

import type { SmartAccountBalanceRow } from '@latch/types'

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
    return withBalance.filter(
      (t) => t.code.toLowerCase().includes(q) || t.code.toLowerCase() === 'xlm' && 'stellar'.includes(q),
    )
  }, [tokens, search])

  if (loading) {
    return (
      <div className="py-12 text-center text-sm font-bold text-muted">Loading balances…</div>
    )
  }

  if (error) {
    return (
      <div className="py-12 text-center text-sm font-bold text-red-300">{error}</div>
    )
  }

  if (filtered.length === 0) {
    return (
      <div className="py-12 text-center text-sm font-bold text-muted">No tokens available to send</div>
    )
  }

  return (
    <div className="space-y-3">
      {filtered.map((token) => (
        <SendTokenCard key={token.sacContractId} token={token} onSelect={() => onSelect(token)} />
      ))}
    </div>
  )
}
