import React from 'react'
import { SlidersHorizontal, Search } from 'lucide-react'

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
    <div className="flex items-center gap-2 shrink-0">
      <div className="flex min-w-0 flex-1 items-center justify-between gap-2 rounded-2xl border border-border/40 bg-surface px-4 py-2.5 text-fg/80">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search for transactions ..."
          className="w-full bg-transparent text-sm font-semibold outline-none placeholder:text-fg/40 text-fg"
        />
        <Search className="h-[18px] w-[18px] shrink-0 text-fg/40" strokeWidth={2.5} aria-hidden />
      </div>
      <button
        type="button"
        onClick={onFilterClick}
        className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-2xl border border-border/40 bg-surface text-fg/60 hover:bg-surface/70 hover:text-fg active:bg-surface/85 transition-all"
        aria-label="Filter"
      >
        <SlidersHorizontal className="h-[18px] w-[18px]" strokeWidth={2.5} aria-hidden />
      </button>
    </div>
  )
}
