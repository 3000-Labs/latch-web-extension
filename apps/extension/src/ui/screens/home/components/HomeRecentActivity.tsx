import React from 'react'

import type { HistoryItemVm } from '../../../types/history'
import { HomeActivityRow } from './HomeActivityRow'

export function HomeRecentActivity({
  items,
  onViewAll,
  onSelectItem,
}: {
  items: HistoryItemVm[]
  onViewAll: () => void
  onSelectItem?: (item: HistoryItemVm) => void
}) {
  return (
    <div className="flex w-full flex-col items-start gap-2">
      <div className="flex w-full items-center justify-between whitespace-nowrap leading-[1.34]">
        <span className="text-sm font-normal tracking-[-0.28px] text-muted">Recent Activity</span>
        <button
          type="button"
          onClick={onViewAll}
          className="text-xs font-normal tracking-[-0.24px] text-primary"
        >
          View All
        </button>
      </div>

      {items.length === 0 ? (
        <div className="flex h-[79px] w-full items-center justify-center rounded-2xl bg-border">
          <p className="text-base font-normal leading-[1.36] tracking-[-0.32px] text-muted">
            No recent activity
          </p>
        </div>
      ) : (
        <div className="flex h-[222px] w-full flex-col items-start gap-2 overflow-hidden">
          {items.map((item) => (
            <HomeActivityRow
              key={item.id}
              item={item}
              onClick={onSelectItem ? () => onSelectItem(item) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  )
}
