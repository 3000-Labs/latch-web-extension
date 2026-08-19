import React, { useEffect, useState } from 'react'

import addressBookIconUrl from 'url:../../../../assets/home/settings-address-book.svg'

import { MultisigModalShell } from './MultisigModalShell'

export type AddOwnerModalStep = 'none' | 'pasteAddress'

function OwnerDetailsField({
  id,
  label,
  value,
  placeholder,
  onChange,
}: {
  id: string
  label: string
  value: string
  placeholder?: string
  onChange: (value: string) => void
}) {
  return (
    <div className="flex w-full flex-col gap-1">
      <label htmlFor={id} className="text-base font-semibold tracking-[-0.16px] text-[#fcfcfc]">
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-[52px] w-full rounded-xl border border-[#383838] bg-transparent px-3 text-base text-[#fcfcfc] outline-none placeholder:text-[#b3b3b3]"
      />
    </div>
  )
}

export function AddOwnerFlowModals({
  step,
  onClose,
  onAddOwner,
}: {
  step: AddOwnerModalStep
  onClose: () => void
  onAddOwner: (ownerName: string, address: string) => void
}) {
  const [ownerName, setOwnerName] = useState('')
  const [address, setAddress] = useState('')

  useEffect(() => {
    if (step !== 'pasteAddress') {
      setOwnerName('')
      setAddress('')
    }
  }, [step])

  const canAdd = ownerName.trim().length > 0 && address.trim().length > 0

  return (
    <MultisigModalShell isOpen={step === 'pasteAddress'} title="Add owner by address" onClose={onClose}>
      <div className="flex w-full flex-col gap-4">
        <div className="flex items-center gap-2 rounded-[14px] bg-[#2a2928] p-3">
          <img src={addressBookIconUrl} alt="" className="size-6 object-contain" />
          <p className="text-sm text-[#b3b3b3]">Paste a Stellar G-address for a co-owner.</p>
        </div>
        <OwnerDetailsField
          id="owner-name"
          label="Owner Name"
          value={ownerName}
          placeholder="e.g., Alex"
          onChange={setOwnerName}
        />
        <OwnerDetailsField
          id="wallet-address"
          label="Wallet Address"
          value={address}
          placeholder="G..."
          onChange={setAddress}
        />
        <button
          type="button"
          disabled={!canAdd}
          onClick={() => onAddOwner(ownerName.trim(), address.trim())}
          className={[
            'h-12 w-full rounded-[32px] text-sm font-medium',
            canAdd ? 'bg-primary text-[#121212]' : 'cursor-not-allowed bg-[#383838] text-[#d7d7d7]',
          ].join(' ')}
        >
          Add
        </button>
      </div>
    </MultisigModalShell>
  )
}
