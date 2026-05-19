import React from 'react'
import { User } from 'lucide-react'

import { truncateMiddle } from '../../lib/sendAddress'
import type { AddressBookEntry } from './useAddressBook'

export function SendAddressBookRow({
  entry,
  onSelect,
}: {
  entry: AddressBookEntry
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full items-center gap-3 py-3 text-left hover:opacity-90"
    >
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary">
        <User className="h-5 w-5 text-black" strokeWidth={2} aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-extrabold">{entry.name}</div>
        <div className="truncate text-xs font-bold text-muted">{truncateMiddle(entry.address)}</div>
      </div>
    </button>
  )
}
