import React from 'react'

import myProfileIconUrl from 'url:../../../../assets/home/settings-my-profile.svg'

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
      className="flex w-full items-center rounded-[14px] py-1 text-left"
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <div className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-lg bg-primary p-1">
          <img src={myProfileIconUrl} alt="" className="h-5 w-5 object-contain" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="truncate text-base font-semibold leading-[1.31] tracking-[-0.16px] text-[#fcfcfc]">
            {entry.name}
          </p>
          <p className="truncate text-sm font-normal leading-[1.34] tracking-[-0.28px] text-[#b3b3b3]">
            {truncateMiddle(entry.address, 6, 4)}
          </p>
        </div>
      </div>
    </button>
  )
}
