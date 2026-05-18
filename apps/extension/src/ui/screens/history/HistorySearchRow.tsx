import React from 'react'
import { ListFilter, Search } from 'lucide-react'

export function HistorySearchRow({
  value,
  onChange,
  onFilterClick,
}: {
  value: string
  onChange: (next: string) => void
  onFilterClick?: () => void
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-border bg-surface/40 px-4 py-2 text-fg/80">
        <Search className="h-[18px] w-[18px] shrink-0 text-fg/60" strokeWidth={2} aria-hidden />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search for transactions ..."
          className="w-full bg-transparent text-sm font-bold outline-none placeholder:text-fg/40"
        />
      </div>
      <button
        type="button"
        onClick={onFilterClick}
        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border bg-surface/40 text-fg/80 hover:bg-surface/60"
        aria-label="Filter"
      >
        <ListFilter className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
      </button>
    </div>
  )
}
