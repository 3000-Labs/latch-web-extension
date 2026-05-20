import React from 'react'
import { ChevronRight } from 'lucide-react'

export function SendSummaryFactRow({
  label,
  value,
  showChevron,
}: {
  label: string
  value: React.ReactNode
  showChevron?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <div className="text-sm font-bold text-muted">{label}</div>
      <div className="flex min-w-0 items-center gap-1 text-right">
        <div className="text-sm font-extrabold text-fg">{value}</div>
        {showChevron ? (
          <ChevronRight className="h-4 w-4 shrink-0 text-fg/60" strokeWidth={2} aria-hidden />
        ) : null}
      </div>
    </div>
  )
}
