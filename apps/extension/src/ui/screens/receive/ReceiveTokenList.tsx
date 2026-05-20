import React, { useMemo } from 'react'
import type { SmartAccountBalanceRow } from '@latch/types'
import { ReceiveTokenCard, type ReceiveToken } from './ReceiveTokenCard'

import stellarIcon from 'url:../../../../assets/icons/stellar.png'

export function ReceiveTokenList({
  smartAccountAddress,
  portfolioRows,
  portfolioLoading,
  portfolioError,
  search,
  onSelect,
}: {
  smartAccountAddress: string
  portfolioRows: SmartAccountBalanceRow[]
  portfolioLoading: boolean
  portfolioError: string | null
  search: string
  onSelect: (token: ReceiveToken) => void
}) {
  const tokensList: ReceiveToken[] = useMemo(() => {
    const wellKnownCodes = ['XLM', 'USDC', 'EURC']

    const wellKnownConfigs: Record<string, { name: string; defaultIcon: string | null }> = {
      XLM: { name: 'Stellar', defaultIcon: stellarIcon },
      USDC: { name: 'USD Coin', defaultIcon: 'https://assets.coincap.io/assets/icons/usdc@2x.png' },
      EURC: { name: 'EURC', defaultIcon: 'https://assets.coincap.io/assets/icons/eurc@2x.png' },
    }

    // 1. Process well-known assets (ensure they are always in the list)
    const list: ReceiveToken[] = wellKnownCodes.map((code) => {
      const config = wellKnownConfigs[code]
      const row = portfolioRows.find((r) => r.code.toUpperCase() === code)

      return {
        id: code.toLowerCase(),
        name: config.name,
        symbol: code,
        balance: row ? row.amount : '0',
        address: smartAccountAddress,
        iconUrl: row?.iconUrl || config.defaultIcon,
      }
    })

    // 2. Append any extra assets from portfolioRows that are not well-known
    portfolioRows.forEach((row) => {
      const codeUpper = row.code.toUpperCase()
      if (!wellKnownCodes.includes(codeUpper)) {
        list.push({
          id: row.sacContractId || codeUpper.toLowerCase(),
          name: row.code,
          symbol: row.code,
          balance: row.amount,
          address: smartAccountAddress,
          iconUrl: row.iconUrl || null,
        })
      }
    })

    return list
  }, [portfolioRows, smartAccountAddress])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return tokensList
    return tokensList.filter(
      (t) => t.name.toLowerCase().includes(q) || t.symbol.toLowerCase().includes(q)
    )
  }, [tokensList, search])

  if (portfolioLoading) {
    return <div className="py-12 text-center text-sm font-bold text-muted">Loading balances...</div>
  }

  if (portfolioError) {
    return <div className="py-12 text-center text-sm font-bold text-red-400">{portfolioError}</div>
  }

  if (filtered.length === 0) {
    return (
      <div className="py-12 text-center text-sm font-bold text-muted">
        No tokens match "{search}"
      </div>
    )
  }

  return (
    <div className="space-y-3 pb-6">
      {filtered.map((token) => (
        <ReceiveTokenCard key={token.id} token={token} onSelect={() => onSelect(token)} />
      ))}
    </div>
  )
}
