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
        <div key={section.title}>
          <div className="text-xs font-extrabold text-muted">{section.title}</div>
          <div className="mt-3 space-y-3">
            {section.items.map((it) => (
              <HistoryTransactionRow
                key={it.id}
                item={it}
                onClick={() => onSelectItem?.(it.id)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
