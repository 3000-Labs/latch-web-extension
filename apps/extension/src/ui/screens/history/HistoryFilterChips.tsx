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
    <div className="flex flex-wrap gap-2">
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
  )
}
