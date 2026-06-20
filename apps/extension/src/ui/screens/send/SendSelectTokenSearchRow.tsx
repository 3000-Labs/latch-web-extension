import React from 'react'

import filterIconUrl from 'url:../../../../assets/home/icon-filter.svg'
import searchIconUrl from 'url:../../../../assets/home/icon-search.svg'

export function SendSelectTokenSearchRow({
  value,
  onChange,
  placeholder = 'Search for tokens ...',
  filterAriaLabel = 'Filter tokens',
}: {
  value: string
  onChange: (next: string) => void
  placeholder?: string
  filterAriaLabel?: string
}) {
  return (
    <div className="flex w-full shrink-0 items-center gap-2">
      <div className="flex h-[34px] min-w-0 flex-1 items-center justify-between rounded-xl border border-stroke px-3">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent text-xs tracking-[-0.24px] text-fg outline-none placeholder:text-muted"
        />
        <img src={searchIconUrl} alt="" className="h-4 w-4 shrink-0" aria-hidden />
      </div>
      <button
        type="button"
        className="grid size-[34px] shrink-0 place-items-center rounded-xl border border-stroke"
        aria-label={filterAriaLabel}
      >
        <img src={filterIconUrl} alt="" className="h-[22px] w-[22px]" aria-hidden />
      </button>
    </div>
  )
}
