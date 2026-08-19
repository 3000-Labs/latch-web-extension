import React, { useMemo, useState } from 'react'

import chevronDownIconUrl from 'url:../../../../assets/home/icon-chevron-down.svg'

import { isValidStellarRecipient } from '../../lib/sendAddress'
import { saveToAddressBook } from '../send/useAddressBook'
import { SettingsScreenHeader } from './SettingsScreenHeader'

function SettingsFormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex w-full flex-col gap-1">
      <span className="text-base font-semibold leading-[1.31] tracking-[-0.16px] text-[#fcfcfc]">
        {label}
      </span>
      {children}
    </div>
  )
}

export function AddAddressScreen({
  networkLabel,
  onBack,
  onSaved,
}: {
  networkLabel: string
  onBack: () => void
  onSaved: () => void
}) {
  const [label, setLabel] = useState('')
  const [address, setAddress] = useState('')
  const [saving, setSaving] = useState(false)

  const canSave = useMemo(() => {
    return label.trim().length > 0 && isValidStellarRecipient(address) && !saving
  }, [address, label, saving])

  const handleSave = async () => {
    if (!canSave) return
    setSaving(true)
    try {
      await saveToAddressBook({ name: label.trim(), address: address.trim() })
      onSaved()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex h-full w-full min-h-0 flex-col gap-4">
      <SettingsScreenHeader title="Address Book" onBack={onBack} />

      <div className="flex min-h-0 flex-1 flex-col justify-between">
        <div className="flex w-full flex-col gap-2">
          <SettingsFormField label="Network">
            <div className="flex h-[52px] w-full items-center justify-between rounded-xl border border-[#383838] px-3">
              <span className="text-base tracking-[-0.32px] text-[#fcfcfc]">{networkLabel}</span>
              <img src={chevronDownIconUrl} alt="" className="size-6 shrink-0" aria-hidden />
            </div>
          </SettingsFormField>

          <SettingsFormField label="Label">
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Label your address"
              maxLength={32}
              className="h-[52px] w-full rounded-xl border border-[#383838] bg-transparent px-3 text-base tracking-[-0.32px] text-[#fcfcfc] placeholder:text-[#b3b3b3] outline-none"
            />
          </SettingsFormField>

          <SettingsFormField label="Wallet Address">
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Input an address"
              spellCheck={false}
              className="h-[52px] w-full rounded-xl border border-[#383838] bg-transparent px-3 text-base tracking-[-0.32px] text-[#fcfcfc] placeholder:text-[#b3b3b3] outline-none"
            />
          </SettingsFormField>
        </div>

        <button
          type="button"
          disabled={!canSave}
          onClick={() => void handleSave()}
          className={[
            'relative h-12 w-full shrink-0 rounded-[32px] border px-5 py-3 text-base font-semibold tracking-[-0.16px] transition-all',
            canSave
              ? 'cursor-pointer border-[#f0a300] bg-primary text-[#121212] shadow-[0px_12px_13.1px_-8px_rgba(246,139,7,0.1)] hover:brightness-105 active:scale-[0.98]'
              : 'cursor-not-allowed border-[#2b2a29] bg-[#383838] text-[#d7d7d7] shadow-[0px_12px_13.1px_-8px_rgba(56,56,56,0.1)]',
          ].join(' ')}
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[inherit] shadow-[inset_0px_2px_4px_0px_rgba(255,255,255,0.26)]"
          />
          Save Address
        </button>
      </div>
    </div>
  )
}
