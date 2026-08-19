import React, { useMemo } from 'react'
import type { SmartAccountBalanceRow } from '@latch/types'

import stellarIcon from 'url:../../../../assets/icons/stellar.png'

import { tokenDisplayName } from '../../lib/sendAddress'
import { ReceiveTokenCard, type ReceiveToken } from './ReceiveTokenCard'

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
      XLM: { name: tokenDisplayName('XLM'), defaultIcon: stellarIcon },
      USDC: { name: 'USD Coin', defaultIcon: 'https://assets.coincap.io/assets/icons/usdc@2x.png' },
      EURC: { name: 'EURC', defaultIcon: 'https://assets.coincap.io/assets/icons/eurc@2x.png' },
    }

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

    portfolioRows.forEach((row) => {
      const codeUpper = row.code.toUpperCase()
      if (!wellKnownCodes.includes(codeUpper)) {
        list.push({
          id: row.sacContractId || codeUpper.toLowerCase(),
          name: tokenDisplayName(row.code),
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
    return (
      <div className="py-12 text-center text-sm tracking-[-0.28px] text-muted">
        Loading balances…
      </div>
    )
  }

  if (portfolioError) {
    return (
      <div className="py-12 text-center text-sm tracking-[-0.28px] text-red-300">
        {portfolioError}
      </div>
    )
  }

  if (filtered.length === 0) {
    return (
      <div className="py-12 text-center text-sm tracking-[-0.28px] text-muted">
        No tokens match &ldquo;{search}&rdquo;
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 pb-6">
      {filtered.map((token) => (
        <ReceiveTokenCard key={token.id} token={token} onSelect={() => onSelect(token)} />
      ))}
    </div>
  )
}
