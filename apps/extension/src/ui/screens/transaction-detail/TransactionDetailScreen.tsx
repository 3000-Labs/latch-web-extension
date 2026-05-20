import React from 'react'

import type { TransactionDetailVm } from '../../types/transaction-detail'
import { TransactionDetailFacts } from './TransactionDetailFacts'
import { TransactionDetailHeader } from './TransactionDetailHeader'
import { TransactionDetailHero } from './TransactionDetailHero'
import { TransactionDetailProgress } from './TransactionDetailProgress'
import { TransactionHashSection } from './TransactionHashSection'
import { ViewOnStellarExplorerButton } from './ViewOnStellarExplorerButton'

export type TransactionDetailSurface = 'popup' | 'sidepanel'

function stellarExpertTxUrl(hash: string): string {
  const net = process.env.PLASMO_PUBLIC_STELLAR_NETWORK === 'mainnet' ? 'public' : 'testnet'
  return `https://stellar.expert/explorer/${net}/tx/${encodeURIComponent(hash)}`
}

function formatDetailDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatStepTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '~~'
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

export function TransactionDetailScreen({
  surface: _surface,
  detail,
  onBack,
}: {
  surface: TransactionDetailSurface
  detail: TransactionDetailVm
  onBack: () => void
}) {
  const stepTimes: [string, string, string] = [
    formatStepTime(detail.createdAt),
    formatStepTime(detail.createdAt),
    formatStepTime(detail.createdAt),
  ]

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto px-2 pb-4 pt-2">
      <TransactionDetailHeader onBack={onBack} />
      <TransactionDetailHero
        assetCode={detail.assetCode}
        iconUrl={detail.iconUrl}
        amountUsd={detail.amountUsd}
        status={detail.status}
      />
      <TransactionDetailProgress stepTimes={detail.stepTimes ?? stepTimes} />
      <TransactionHashSection hash={detail.transactionHash} />
      <TransactionDetailFacts
        dateLabel={formatDetailDate(detail.createdAt)}
        from={detail.from}
        to={detail.to}
        networkFee={detail.networkFee}
        blockNumber={detail.blockNumber}
        networkLabel={detail.networkLabel}
      />
      <ViewOnStellarExplorerButton href={stellarExpertTxUrl(detail.transactionHash)} />
    </div>
  )
}
