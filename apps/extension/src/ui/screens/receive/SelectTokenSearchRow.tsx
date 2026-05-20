import React from 'react'
import { Search } from 'lucide-react'

export function SelectTokenSearchRow({
  value,
  onChange,
}: {
  value: string
  onChange: (val: string) => void
}) {
  return (
    <div className="relative flex shrink-0 items-center rounded-full border border-border bg-surface/40 px-4 py-2 text-fg/80">
      <input
        type="text"
        placeholder="Search for tokens..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent pr-8 text-sm font-bold outline-none placeholder:text-fg/40"
      />
      <Search
        className="pointer-events-none absolute right-4 h-[18px] w-[18px] shrink-0 text-fg/60"
        strokeWidth={2}
        aria-hidden
      />
    </div>
  )
}
