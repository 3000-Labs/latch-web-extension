import React, { useMemo, useState } from 'react'

import backIconUrl from 'url:../../../../assets/home/icon-back.svg'
import filterIconUrl from 'url:../../../../assets/home/icon-filter.svg'
import searchIconUrl from 'url:../../../../assets/home/icon-search.svg'

import { TokenAvatar } from '../../components/TokenAvatar'
import type { HistoryItemVm } from '../../types/history'

function exploreStatusLabel(item: HistoryItemVm): string {
  if (item.status === 'pending') return 'Pending'
  if (item.kind === 'received' || item.kind === 'deposit') return 'Received'
  if (item.kind === 'sent') return 'Sent'
  return 'Completed'
}

function formatCalendarDate(dateStr: string): string {
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function amountDisplay(item: HistoryItemVm): string {
  if (item.amountUsd) {
    const raw = item.amountUsd.replace(/[^0-9.-]/g, '')
    const n = parseFloat(raw)
    if (Number.isFinite(n)) {
      const sign = item.kind === 'sent' ? '-' : '+'
      return `${sign}$${Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }
  }
  return item.amountLabel
}

function ExploreTransactionRow({
  item,
  onClick,
}: {
  item: HistoryItemVm
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center rounded-[14px] bg-card p-3 text-left"
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <TokenAvatar
          symbol={item.assetCode}
          iconUrl={item.iconUrl}
          rounded="rounded-lg"
          className="h-8 w-8"
        />
        <div className="min-w-0 flex-1">
          <div className="text-base font-semibold tracking-[-0.16px] text-fg">{item.asset}</div>
          <div className="flex items-center gap-1 text-sm tracking-[-0.28px] text-muted">
            <span>{exploreStatusLabel(item)}</span>
            <span className="h-[3px] w-[3px] rounded-[1px] bg-border" aria-hidden />
            <span>{item.timeLabel}</span>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-base font-semibold tracking-[-0.16px] text-fg">
            {amountDisplay(item)}
          </div>
          <div className="text-sm tracking-[-0.28px] text-muted">
            {formatCalendarDate(item.createdAt)}
          </div>
        </div>
      </div>
    </button>
  )
}

export function ExploreScreen({
  items,
  loading,
  error,
  onBack,
  onSelectItem,
}: {
  items: HistoryItemVm[]
  loading?: boolean
  error?: string | null
  onBack: () => void
  onSelectItem?: (item: HistoryItemVm) => void
}) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter(
      (it) =>
        it.asset.toLowerCase().includes(q) ||
        it.assetCode.toLowerCase().includes(q) ||
        it.transactionHash.toLowerCase().includes(q)
    )
  }, [items, query])

  return (
    <div className="flex min-h-0 flex-1 flex-col pb-[74px] animate-screenIn">
      <div className="grid h-[22px] grid-cols-[20px_1fr_20px] items-center">
        <button type="button" onClick={onBack} className="h-5 w-5 shrink-0" aria-label="Back">
          <img src={backIconUrl} alt="" className="h-5 w-5" />
        </button>
        <p className="text-center text-sm font-medium tracking-[-0.14px] text-[#fbfbfb]">Explore</p>
        <div aria-hidden />
      </div>

      <div className="mt-5 flex min-h-0 flex-1 flex-col gap-5 overflow-hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-[34px] min-w-0 flex-1 items-center justify-between rounded-xl border border-stroke px-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for transactions ..."
              className="w-full bg-transparent text-xs tracking-[-0.24px] text-fg outline-none placeholder:text-muted"
            />
            <img src={searchIconUrl} alt="" className="h-4 w-4 shrink-0" aria-hidden />
          </div>
          <button
            type="button"
            className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-xl border border-stroke"
            aria-label="Filter"
          >
            <img src={filterIconUrl} alt="" className="h-[22px] w-[22px]" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto">
          {loading ? (
            <p className="text-sm text-muted">Loading transactions…</p>
          ) : error ? (
            <p className="text-sm text-red-300">{error}</p>
          ) : (
            <>
              <p className="text-sm tracking-[-0.28px] text-muted">
                {filtered.length} result{filtered.length === 1 ? '' : 's'}
              </p>
              <div className="mt-4 flex flex-col gap-2">
                {filtered.map((item) => (
                  <ExploreTransactionRow
                    key={item.id}
                    item={item}
                    onClick={onSelectItem ? () => onSelectItem(item) : undefined}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
