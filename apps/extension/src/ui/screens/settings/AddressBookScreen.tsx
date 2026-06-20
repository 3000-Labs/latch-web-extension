import React, { useState } from 'react'
import { Plus } from 'lucide-react'

import { useAddressBook } from '../send/useAddressBook'
import { AddAddressScreen } from './AddAddressScreen'
import { AddressBookEmptyState } from './AddressBookEmptyState'
import { AddressBookListRow } from './AddressBookListRow'
import { SettingsScreenHeader } from './SettingsScreenHeader'

type AddressBookView = 'list' | 'add'

export function AddressBookScreen({
  networkLabel,
  onBack,
}: {
  networkLabel: string
  onBack: () => void
}) {
  const { entries, loaded, reload } = useAddressBook()
  const [view, setView] = useState<AddressBookView>('list')

  const handleSaved = async () => {
    await reload()
    setView('list')
  }

  if (view === 'add') {
    return (
      <AddAddressScreen
        networkLabel={networkLabel}
        onBack={() => setView('list')}
        onSaved={() => void handleSaved()}
      />
    )
  }

  const hasEntries = loaded && entries.length > 0

  return (
    <div className="flex h-full w-full min-h-0 flex-col gap-4">
      <SettingsScreenHeader
        title="Address Book"
        onBack={onBack}
        rightAction={
          <button
            type="button"
            onClick={() => setView('add')}
            className="flex size-5 shrink-0 items-center justify-center"
            aria-label="Add address"
          >
            <Plus className="size-5 text-[#cdcdcd]" strokeWidth={1.5} />
          </button>
        }
      />

      {hasEntries ? (
        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto">
          <div className="flex w-full flex-col">
            {entries.map((entry) => (
              <AddressBookListRow key={entry.id} entry={entry} />
            ))}
          </div>
        </div>
      ) : loaded ? (
        <AddressBookEmptyState />
      ) : null}
    </div>
  )
}
