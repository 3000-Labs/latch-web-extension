import React from 'react'

import type { HistorySectionVm } from '../../types/history'
import { HistoryTransactionRow } from './HistoryTransactionRow'

export function HistorySectionList({
  sections,
  onSelectItem,
}: {
  sections: HistorySectionVm[]
  onSelectItem?: (id: string) => void
}) {
  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <div key={section.title} className="space-y-2.5">
          <div className="px-1 text-xs font-bold text-muted/60 uppercase tracking-wider">
            {section.title}
          </div>
          <div className="space-y-3">
            {section.items.map((it) => (
              <HistoryTransactionRow key={it.id} item={it} onClick={() => onSelectItem?.(it.id)} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
