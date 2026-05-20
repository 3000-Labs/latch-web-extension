import React from 'react'

import { FilterChip } from '../../components/FilterChip'
import type { HistoryKind } from '../../types/history'

export type HistoryFilter = 'all' | HistoryKind

export function HistoryFilterChips({
  active,
  onChange,
}: {
  active: HistoryFilter
  onChange: (f: HistoryFilter) => void
}) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1 -mx-4 px-4">
      <div className="flex gap-2 shrink-0">
        <FilterChip active={active === 'all'} onClick={() => onChange('all')}>
          All
        </FilterChip>
        <FilterChip active={active === 'sent'} onClick={() => onChange('sent')}>
          Sent
        </FilterChip>
        <FilterChip active={active === 'received'} onClick={() => onChange('received')}>
          Received
        </FilterChip>
        <FilterChip active={active === 'deposit'} onClick={() => onChange('deposit')}>
          Deposit
        </FilterChip>
        <FilterChip active={active === 'swap'} onClick={() => onChange('swap')}>
          Swaps
        </FilterChip>
      </div>
    </div>
  )
}
