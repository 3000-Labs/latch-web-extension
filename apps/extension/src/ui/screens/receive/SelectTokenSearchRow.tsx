import React from 'react'

import searchIconUrl from 'url:../../../../assets/home/icon-search.svg'

export function SelectTokenSearchRow({
  value,
  onChange,
}: {
  value: string
  onChange: (val: string) => void
}) {
  return (
    <div className="flex h-[34px] w-full shrink-0 items-center justify-between rounded-xl border border-stroke px-3">
      <input
        type="text"
        placeholder="Search for tokens..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent text-xs tracking-[-0.24px] text-fg outline-none placeholder:text-muted"
      />
      <img src={searchIconUrl} alt="" className="h-4 w-4 shrink-0" aria-hidden />
    </div>
  )
}
