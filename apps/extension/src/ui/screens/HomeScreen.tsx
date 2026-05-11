import React, { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, Eye, EyeOff, Plus, SlidersHorizontal } from 'lucide-react'

import swapIconUrl from 'url:../../../assets/icons/swap-icon.svg'

import { ActionIconButton } from '../components/ActionIconButton'
import { NewsCarousel } from '../components/NewsCarousel'
import { mockTokens, mockTotalBalanceUsd } from '../mock/wallet'

const iconProps = { className: 'h-5 w-5', strokeWidth: 2 } as const

export function HomeScreen({
  accountName: _accountName,
  onOpenHistory: _onOpenHistory,
  onOpenSwap,
}: {
  accountName: string
  onOpenHistory: () => void
  onOpenSwap: () => void
}) {
  const [hidden, setHidden] = useState(false)
  const [tab, setTab] = useState<'tokens' | 'collectibles'>('tokens')
  const total = hidden ? '•••' : mockTotalBalanceUsd

  const tokens = useMemo(() => mockTokens, [])

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mt-7 text-center">
        <div className="flex items-center justify-center gap-2 text-sm font-bold text-muted">
          <span>Total Balance</span>
          <button
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
        <div className="mt-2 text-[56px] font-bold tracking-tight">{total}</div>
      </div>

      <div className="mt-8 flex items-center justify-center gap-2">
        <ActionIconButton label="Add" icon={<Plus {...iconProps} />} />
        <ActionIconButton label="Send" icon={<ArrowUp {...iconProps} />} />
        <ActionIconButton label="Receive" icon={<ArrowDown {...iconProps} />} />
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
            className={[
              'text-lg font-extrabold',
              tab === 'tokens' ? 'text-fg' : 'text-muted hover:text-fg/80',
            ].join(' ')}
            onClick={() => setTab('tokens')}
          >
            Tokens
          </button>
          <button
            className={[
              'text-lg font-extrabold',
              tab === 'collectibles' ? 'text-fg' : 'text-muted hover:text-fg/80',
            ].join(' ')}
            onClick={() => setTab('collectibles')}
          >
            Collectibles
          </button>
        </div>
        <button
          className="rounded-full border border-border px-3 py-2 text-xs font-extrabold text-fg/80 hover:bg-surface/60"
          aria-label="Filters"
          title="Filters"
        >
          <SlidersHorizontal className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
        </button>
      </div>

      {tab === 'collectibles' ? (
        <div className="mt-6 rounded-2xl border border-border bg-surface/40 p-6 text-center text-sm font-bold text-muted">
          No collectibles yet
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {tokens.map((t) => (
            <button
              key={t.id}
              className="flex w-full items-center justify-between rounded-2xl border border-border bg-surface/40 px-4 py-4 text-left hover:bg-surface/60"
            >
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/20 text-primary">
                  <span className="text-sm font-extrabold">{t.symbol.slice(0, 1)}</span>
                </div>
                <div>
                  <div className="text-sm font-extrabold">{t.symbol}</div>
                  <div className="text-xs font-bold text-muted">{t.balance}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-extrabold">{t.balanceUsd}</div>
                <div className="text-xs font-bold text-muted">{t.changePct}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
