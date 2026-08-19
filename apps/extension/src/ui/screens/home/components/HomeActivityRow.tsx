import React from 'react'

import stellarIconUrl from 'url:../../../../../assets/icons/stellar.svg'
import type { HistoryItemVm } from '../../../types/history'

function statusLabel(status: HistoryItemVm['status']): string {
  return status === 'pending' ? 'Pending Transaction' : 'Completed'
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

function activityIconBg(code: string): string {
  const u = code.trim().toUpperCase()
  if (u === 'USDT' || u === 'TETHER') return 'bg-[#13302b]'
  if (u === 'XLM' || u === 'STELLAR') return 'bg-[#302813]'
  return 'bg-[#1e1e1e]'
}

function ActivityIcon({ item }: { item: HistoryItemVm }) {
  const code = item.assetCode.trim().toUpperCase()
  const isXlm = code === 'XLM'
  const isUsdt = code === 'USDT' || code === 'TETHER'
  const src = isXlm ? stellarIconUrl : item.iconUrl
  const iconSizeClass = isUsdt ? 'size-[22px]' : 'size-6'

  return (
    <div
      className={[
        'flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg',
        activityIconBg(item.assetCode),
        isUsdt ? '' : 'p-1',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {src ? (
        <img src={src} alt="" className={`${iconSizeClass} shrink-0 object-contain`} />
      ) : (
        <span className="text-sm font-semibold text-fg">
          {(item.assetCode.trim()[0] ?? '?').toUpperCase()}
        </span>
      )}
    </div>
  )
}

export function HomeActivityRow({ item, onClick }: { item: HistoryItemVm; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full shrink-0 items-center rounded-[14px] bg-[rgb(var(--latch-card))] p-3 text-left"
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <ActivityIcon item={item} />
        <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
          <span className="text-base font-semibold leading-[1.31] tracking-[-0.16px] text-fg">
            {item.asset}
          </span>
          <span className="whitespace-nowrap text-sm font-normal leading-[1.34] tracking-[-0.28px] text-muted">
            {statusLabel(item.status)}
          </span>
        </div>
        <div className="flex min-w-0 flex-1 flex-col items-end gap-1">
          <span className="whitespace-nowrap text-base font-semibold leading-[1.31] tracking-[-0.16px] text-fg">
            {amountDisplay(item)}
          </span>
          <span className="whitespace-nowrap text-sm font-normal leading-[1.34] tracking-[-0.28px] text-muted">
            {item.timeLabel}
          </span>
        </div>
      </div>
    </button>
  )
}
