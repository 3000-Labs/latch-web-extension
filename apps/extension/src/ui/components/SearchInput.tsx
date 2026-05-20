import React from 'react'
import { Search } from 'lucide-react'

export function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (next: string) => void
  placeholder?: string
}) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-border bg-surface/40 px-4 py-2 text-fg/80">
      <Search className="h-[18px] w-[18px] shrink-0 text-fg/60" strokeWidth={2} aria-hidden />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? 'Search'}
        className="w-full bg-transparent text-sm font-bold outline-none placeholder:text-fg/40"
      />
    </div>
  )
}
