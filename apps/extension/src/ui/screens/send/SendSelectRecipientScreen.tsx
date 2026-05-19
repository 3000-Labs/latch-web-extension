import React, { useMemo } from 'react'

import type { SmartAccountBalanceRow } from '@latch/types'

import { isValidStellarRecipient } from '../../lib/sendAddress'
import { SendAddressBookSection } from './SendAddressBookSection'
import { SendRecipientAddressField } from './SendRecipientAddressField'
import { SendSelectRecipientHeader } from './SendSelectRecipientHeader'
import { useAddressBook } from './useAddressBook'

export function SendSelectRecipientScreen({
  token,
  recipientAddress,
  onRecipientChange,
  onBack,
  onContinue,
}: {
  token: SmartAccountBalanceRow
  recipientAddress: string
  onRecipientChange: (address: string, name?: string) => void
  onBack: () => void
  onContinue: () => void
}) {
  const { entries } = useAddressBook()
  const valid = useMemo(() => isValidStellarRecipient(recipientAddress), [recipientAddress])

  const tryContinue = () => {
    if (valid) onContinue()
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SendSelectRecipientHeader title={`Select ${token.code}`} onBack={onBack} />
      <div className="mt-6 min-h-0 flex-1 overflow-auto">
        <SendRecipientAddressField
          value={recipientAddress}
          onChange={(v) => onRecipientChange(v)}
          onQrClick={() => {}}
          onKeyDown={(e) => {
            if (e.key === 'Enter') tryContinue()
          }}
          onBlur={() => tryContinue()}
        />
        <SendAddressBookSection
          entries={entries}
          onSelect={(entry) => {
            onRecipientChange(entry.address, entry.name)
            onContinue()
          }}
        />
      </div>
    </div>
  )
}
