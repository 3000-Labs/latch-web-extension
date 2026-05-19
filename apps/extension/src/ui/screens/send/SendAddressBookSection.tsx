import React from 'react'
import { BookOpen } from 'lucide-react'

import type { AddressBookEntry } from './useAddressBook'
import { SendAddressBookRow } from './SendAddressBookRow'

export function SendAddressBookSection({
  entries,
  onSelect,
}: {
  entries: AddressBookEntry[]
  onSelect: (entry: AddressBookEntry) => void
}) {
  return (
    <div className="mt-6">
      <div className="flex items-center gap-2 text-muted">
        <BookOpen className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
        <span className="text-sm font-bold">Address Book</span>
      </div>
      <div className="mt-2">
        {entries.map((entry) => (
          <SendAddressBookRow key={entry.id} entry={entry} onSelect={() => onSelect(entry)} />
        ))}
      </div>
    </div>
  )
}
