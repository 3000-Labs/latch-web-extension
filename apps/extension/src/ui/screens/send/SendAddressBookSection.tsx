import React from 'react'

import addressBookIconUrl from 'url:../../../../assets/home/settings-address-book.svg'

import type { AddressBookEntry } from './useAddressBook'
import { SendAddressBookRow } from './SendAddressBookRow'

export function SendAddressBookSection({
  entries,
  hasSavedEntries,
  onSelect,
}: {
  entries: AddressBookEntry[]
  hasSavedEntries: boolean
  onSelect: (entry: AddressBookEntry) => void
}) {
  if (!hasSavedEntries) {
    return null
  }

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex items-center gap-2">
        <img src={addressBookIconUrl} alt="" className="size-5 shrink-0" aria-hidden />
        <p className="flex-1 text-sm font-normal leading-[1.34] tracking-[-0.28px] text-[#b3b3b3]">
          Address Book
        </p>
      </div>
      {entries.length === 0 ? (
        <p className="text-sm tracking-[-0.28px] text-muted">No addresses match your search</p>
      ) : (
        <div className="flex flex-col gap-2">
          {entries.map((entry) => (
            <SendAddressBookRow key={entry.id} entry={entry} onSelect={() => onSelect(entry)} />
          ))}
        </div>
      )}
    </div>
  )
}
