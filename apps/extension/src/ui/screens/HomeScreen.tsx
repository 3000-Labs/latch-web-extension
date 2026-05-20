import React, { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, Clock, Eye, EyeOff, Plus, SlidersHorizontal } from 'lucide-react'

import swapIconUrl from 'url:../../../assets/icons/swap-icon.svg'

import { ActionIconButton } from '../components/ActionIconButton'
import { NewsCarousel } from '../components/NewsCarousel'
import { TokenAvatar } from '../components/TokenAvatar'
import { formatDisplayAmount2dp } from '../lib/formatDisplay'

const iconProps = { className: 'h-5 w-5', strokeWidth: 2 } as const

export type HomePortfolioToken = {
  id: string
  symbol: string
  balance: string
  balanceUsd?: string | null
  iconUrl?: string | null
}

export function HomeScreen({
  accountName: _accountName,
  onOpenHistory,
  onOpenSend,
  onOpenReceive,
  onOpenSwap,
  onOpenMigrateAssets,
  portfolioTokens,
  portfolioLoading,
  portfolioError,
  totalBalanceUsd,
}: {
  accountName: string
  onOpenHistory: () => void
  onOpenSend?: () => void
  onOpenReceive?: () => void
  onOpenSwap: () => void
  onOpenMigrateAssets?: () => void
  portfolioTokens: HomePortfolioToken[]
  portfolioLoading: boolean
  portfolioError: string | null
  totalBalanceUsd?: string | null
}) {
  const [hidden, setHidden] = useState(false)
  const [tab, setTab] = useState<'tokens' | 'collectibles'>('tokens')

  const totalDisplay = useMemo(() => {
    if (hidden) return '•••'
    if (portfolioLoading) return '…'
    if (portfolioError) return '—'
    if (totalBalanceUsd) return `$${totalBalanceUsd}`
    return '—'
  }, [hidden, portfolioLoading, portfolioError, totalBalanceUsd])

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {onOpenMigrateAssets ? (
        <button
          type="button"
          onClick={onOpenMigrateAssets}
          className="mt-3 w-full rounded-2xl border border-primary/50 bg-surface/90 px-4 py-3 text-left shadow-soft hover:bg-surface"
        >
          <div className="text-sm font-extrabold text-fg">Move assets to smart account</div>
          <div className="mt-1 text-xs font-bold text-muted">
            You have a balance on your classic Stellar account — tap to migrate.
          </div>
        </button>
      ) : null}

      <div className="mt-7 text-center">
        <div className="flex items-center justify-center gap-2 text-sm font-bold text-muted">
          <span>Total Balance</span>
          <button
            type="button"
            className="text-fg/70 hover:text-fg"
            aria-label={hidden ? 'Show balance' : 'Hide balance'}
            onClick={() => setHidden((v) => !v)}
          >
            {hidden ? (
              <EyeOff className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
            ) : (
              <Eye className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
            )}
          </button>
        </div>
        <div className="mt-2 text-[36px] font-bold tracking-tight">{totalDisplay}</div>
        {portfolioError ? (
          <div className="mt-2 text-xs font-bold text-red-300">{portfolioError}</div>
        ) : null}
      </div>

      <div className="mt-8 flex items-center justify-center gap-2">
        <ActionIconButton label="Add" icon={<Plus {...iconProps} />} />
        <ActionIconButton label="Send" icon={<ArrowUp {...iconProps} />} onClick={onOpenSend} />
        <ActionIconButton
          label="Receive"
          icon={<ArrowDown {...iconProps} />}
          onClick={onOpenReceive}
        />
        <ActionIconButton
          label="Swap"
          icon={<img src={swapIconUrl} alt="" className="h-5 w-5" />}
          onClick={onOpenSwap}
        />
      </div>

      <div className="mt-6">
        <NewsCarousel />
      </div>

      <div className="mt-7 flex items-end justify-between">
        <div className="flex items-center gap-4">
          <button
            type="button"
            className={[
              'text-lg font-extrabold',
              tab === 'tokens' ? 'text-fg' : 'text-muted hover:text-fg/80',
            ].join(' ')}
            onClick={() => setTab('tokens')}
          >
            Tokens
          </button>
          <button
            type="button"
            className={[
              'text-lg font-extrabold',
              tab === 'collectibles' ? 'text-fg' : 'text-muted hover:text-fg/80',
            ].join(' ')}
            onClick={() => setTab('collectibles')}
          >
            Collectibles
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenHistory}
            className="rounded-full border border-border px-3 py-2 text-xs font-extrabold text-fg/80 hover:bg-surface/60"
            aria-label="History"
          >
            <Clock className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
          </button>
          <button
            type="button"
            className="rounded-full border border-border px-3 py-2 text-xs font-extrabold text-fg/80 hover:bg-surface/60"
            aria-label="Filters"
            title="Filters"
          >
            <SlidersHorizontal className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
          </button>
        </div>
      </div>

      {tab === 'collectibles' ? (
        <div className="mt-6 rounded-2xl border border-border bg-surface/40 p-6 text-center text-sm font-bold text-muted">
          No collectibles yet
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {portfolioLoading ? (
            <div className="rounded-2xl border border-border bg-surface/40 px-4 py-6 text-center text-sm font-bold text-muted">
              Loading balances…
            </div>
          ) : portfolioTokens.length === 0 ? (
            <div className="rounded-2xl border border-border bg-surface/40 px-4 py-6 text-center text-sm font-bold text-muted">
              No token balances yet
            </div>
          ) : (
            portfolioTokens.map((t) => (
              <button
                key={t.id}
                type="button"
                className="flex w-full items-center justify-between rounded-2xl border border-border bg-surface/40 px-4 py-4 text-left hover:bg-surface/60"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <TokenAvatar symbol={t.symbol} iconUrl={t.iconUrl} />
                  <div className="min-w-0">
                    <div className="text-sm font-extrabold">{t.symbol}</div>
                    <div className="truncate text-xs font-bold text-muted">
                      {hidden ? '••••' : formatDisplayAmount2dp(t.balance)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-extrabold">
                    {hidden ? '•••' : t.balanceUsd != null ? `$${t.balanceUsd}` : '—'}
                  </div>
                  <div className="text-xs font-bold text-muted">USD</div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
