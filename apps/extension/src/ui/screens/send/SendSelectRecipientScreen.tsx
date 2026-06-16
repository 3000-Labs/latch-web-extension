import React, { useMemo, useState } from 'react'

import type { SmartAccountBalanceRow } from '@latch/types'

import { OnboardingPrimaryButton } from '../../onboarding/components/OnboardingCardButtons'
import { isValidStellarRecipient } from '../../lib/sendAddress'
import { SendAddressBookSection } from './SendAddressBookSection'
import { SendRecipientAddressField } from './SendRecipientAddressField'
import { SendSelectRecipientHeader } from './SendSelectRecipientHeader'
import { SendSelectTokenSearchRow } from './SendSelectTokenSearchRow'
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
  const [search, setSearch] = useState('')
  const valid = useMemo(() => isValidStellarRecipient(recipientAddress), [recipientAddress])

  const filteredEntries = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return entries
    return entries.filter(
      (entry) =>
        entry.name.toLowerCase().includes(q) || entry.address.toLowerCase().includes(q)
    )
  }, [entries, search])

  const tryContinue = () => {
    if (valid) onContinue()
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5 animate-screenIn">
      <SendSelectRecipientHeader title={`Select ${token.code}`} onBack={onBack} />

      <SendSelectTokenSearchRow
        value={search}
        onChange={setSearch}
        placeholder="Search for addresses ..."
        filterAriaLabel="Filter addresses"
      />

      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-auto">
        <SendRecipientAddressField
          value={recipientAddress}
          onChange={(v) => onRecipientChange(v)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') tryContinue()
          }}
        />

        <SendAddressBookSection
          hasSavedEntries={entries.length > 0}
          entries={filteredEntries}
          onSelect={(entry) => {
            onRecipientChange(entry.address, entry.name)
            onContinue()
          }}
        />
      </div>

      <div className="shrink-0">
        {valid ? (
          <OnboardingPrimaryButton onClick={tryContinue}>Continue</OnboardingPrimaryButton>
        ) : (
          <button
            type="button"
            disabled
            className="relative flex h-[50px] w-full cursor-not-allowed items-center justify-center overflow-hidden rounded-[32px] border border-[#2b2a29] px-5 py-3 text-[18px] font-semibold leading-[1.31] tracking-[-0.18px] text-[#d7d7d7] shadow-[0px_12px_13.1px_-8px_rgba(56,56,56,0.1)]"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-[32px] bg-[#383838]"
            />
            <span className="relative">Continue</span>
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-[32px] shadow-[inset_0px_2px_4px_0px_rgba(255,255,255,0.26)]"
            />
          </button>
        )}
      </div>
    </div>
  )
}
