import React, { useEffect, useState } from 'react'
import { Mail } from 'lucide-react'

import addressBookIconUrl from 'url:../../../../assets/home/settings-address-book.svg'

import { MultisigModalShell } from './MultisigModalShell'

export type AddOwnerMethod = 'pasteAddress' | 'inviteEmail'

export type AddOwnerModalStep = 'none' | 'chooseMethod' | 'pasteAddress' | 'inviteEmail'

function MethodOptionCard({
  icon,
  title,
  description,
  onClick,
}: {
  icon: React.ReactNode
  title: string
  description: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-[14px] border border-[#383838] bg-[#2a2928] p-3 text-left"
    >
      <div className="grid size-6 shrink-0 place-items-center">{icon}</div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <p className="text-base font-semibold leading-[1.31] tracking-[-0.16px] text-[#fcfcfc]">
          {title}
        </p>
        <p className="text-sm font-normal leading-[1.34] tracking-[-0.28px] text-[#b3b3b3]">
          {description}
        </p>
      </div>
    </button>
  )
}

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
        className="h-[52px] w-full rounded-xl border border-[#383838] bg-transparent px-3 text-base leading-[1.36] tracking-[-0.32px] text-[#fcfcfc] outline-none placeholder:text-[#b3b3b3]"
      />
    </div>
  )
}

function AddOwnerSubmitButton({
  disabled,
  onClick,
}: {
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={[
        'relative flex h-12 w-full items-center justify-center overflow-hidden rounded-[32px] border px-5 py-3 text-sm font-medium leading-[1.3] tracking-[-0.14px] shadow-[0px_12px_13.1px_-8px_rgba(56,56,56,0.1)]',
        disabled
          ? 'cursor-not-allowed border-[#2b2a29] text-[#d7d7d7]'
          : 'border-[#f0a300] text-[#121212] shadow-[0px_12px_13.1px_-8px_rgba(246,139,7,0.1)]',
      ].join(' ')}
    >
      <span
        aria-hidden
        className={[
          'pointer-events-none absolute inset-0 rounded-[32px]',
          disabled ? 'bg-[#383838]' : 'bg-[#ffad00]',
        ].join(' ')}
      />
      <span className="relative">Add</span>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[32px] shadow-[inset_0px_2px_4px_0px_rgba(255,255,255,0.26)]"
      />
    </button>
  )
}

function AddOwnerDetailsModal({
  isOpen,
  variant,
  onClose,
  onAdd,
}: {
  isOpen: boolean
  variant: AddOwnerMethod
  onClose: () => void
  onAdd: (ownerName: string, detail: string) => void
}) {
  const [ownerName, setOwnerName] = useState('')
  const [detail, setDetail] = useState('')

  useEffect(() => {
    if (!isOpen) {
      setOwnerName('')
      setDetail('')
    }
  }, [isOpen])

  const isAddress = variant === 'pasteAddress'
  const canAdd = ownerName.trim().length > 0 && detail.trim().length > 0

  return (
    <MultisigModalShell isOpen={isOpen} title="Add Owner Details" onClose={onClose}>
      <div className="flex w-full flex-col gap-4">
        <div className="flex w-full flex-col gap-3">
          <OwnerDetailsField
            id="owner-name"
            label="Owner Name"
            value={ownerName}
            placeholder="e.g., Crownz"
            onChange={setOwnerName}
          />
          <OwnerDetailsField
            id={isAddress ? 'wallet-address' : 'email-address'}
            label={isAddress ? 'Wallet Address' : 'Email Address'}
            value={detail}
            placeholder={isAddress ? 'G...' : 'e.g., your@example.com'}
            onChange={setDetail}
          />
        </div>
        <AddOwnerSubmitButton
          disabled={!canAdd}
          onClick={() => onAdd(ownerName.trim(), detail.trim())}
        />
      </div>
    </MultisigModalShell>
  )
}

export function AddOwnerFlowModals({
  step,
  onClose,
  onSelectMethod,
  onAddOwner,
}: {
  step: AddOwnerModalStep
  onClose: () => void
  onSelectMethod: (method: AddOwnerMethod) => void
  onAddOwner: (ownerName: string, method: AddOwnerMethod, detail: string) => void
}) {
  return (
    <>
      <MultisigModalShell
        isOpen={step === 'chooseMethod'}
        title="Choose Method"
        onClose={onClose}
      >
        <div className="flex flex-col gap-3">
          <MethodOptionCard
            icon={<img src={addressBookIconUrl} alt="" className="size-6 object-contain" />}
            title="Paste Address"
            description="Add by wallet address"
            onClick={() => onSelectMethod('pasteAddress')}
          />
          <MethodOptionCard
            icon={<Mail className="size-6 text-[#fcfcfc]" strokeWidth={1.5} aria-hidden />}
            title="Invite via Email"
            description="Send an invitation"
            onClick={() => onSelectMethod('inviteEmail')}
          />
        </div>
      </MultisigModalShell>

      <AddOwnerDetailsModal
        isOpen={step === 'pasteAddress'}
        variant="pasteAddress"
        onClose={onClose}
        onAdd={(ownerName, address) => onAddOwner(ownerName, 'pasteAddress', address)}
      />

      <AddOwnerDetailsModal
        isOpen={step === 'inviteEmail'}
        variant="inviteEmail"
        onClose={onClose}
        onAdd={(ownerName, email) => onAddOwner(ownerName, 'inviteEmail', email)}
      />
    </>
  )
}
