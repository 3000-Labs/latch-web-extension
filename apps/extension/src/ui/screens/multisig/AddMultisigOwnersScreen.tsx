import React, { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'

import type { StoredAccount } from '@latch/types'

import closeIconUrl from 'url:../../../../assets/home/icon-close.svg'
import myProfileIconUrl from 'url:../../../../assets/home/settings-my-profile.svg'

import { OnboardingPrimaryButton } from '../../onboarding/components/OnboardingCardButtons'
import { OnboardingSmallEmblem } from '../../onboarding/components/OnboardingSmallEmblem'

import {
  AddOwnerFlowModals,
  type AddOwnerMethod,
  type AddOwnerModalStep,
} from './AddOwnerFlowModals'

export type MultisigOwner = {
  id: string
  name: string
  isDefault?: boolean
  accountId?: string
  address?: string
  email?: string
  method?: AddOwnerMethod
}

function findAccountByAddress(
  accounts: StoredAccount[],
  address: string
): StoredAccount | undefined {
  const trimmed = address.trim()
  return accounts.find(
    (account) =>
      account.smartAccountAddress === trimmed ||
      (account.gAddress != null && account.gAddress === trimmed)
  )
}

function isCreatorSignerAddress(creatorSignerAddresses: string[], address: string): boolean {
  const trimmed = address.trim()
  return creatorSignerAddresses.some((candidate) => candidate === trimmed)
}

function MultisigOwnerRow({
  owner,
  onRemove,
}: {
  owner: MultisigOwner
  onRemove: () => void
}) {
  return (
    <div className="flex w-full items-center gap-2 rounded-[14px] bg-[#2a2928] p-3">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <div className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-lg bg-[#1e1e1e] p-1">
          <img src={myProfileIconUrl} alt="" className="h-5 w-5 object-contain" />
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-1">
          <span className="truncate text-base font-semibold leading-[1.31] tracking-[-0.16px] text-[#fcfcfc]">
            {owner.name}
          </span>
          {owner.isDefault ? (
            <span className="shrink-0 rounded-lg bg-[rgba(255,173,0,0.08)] px-2 py-1 text-xs font-medium leading-[1.3] tracking-[-0.12px] text-primary">
              Default Owner
            </span>
          ) : (
            <span className="shrink-0 rounded-lg bg-[rgba(62,233,107,0.08)] px-2 py-1 text-xs font-medium leading-[1.3] tracking-[-0.12px] text-[#3ee96b]">
              Added
            </span>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="relative size-6 shrink-0"
        aria-label={`Remove ${owner.name}`}
      >
        <img
          src={closeIconUrl}
          alt=""
          className="pointer-events-none absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2"
        />
      </button>
    </div>
  )
}

export function AddMultisigOwnersScreen({
  creatorSignerAddresses,
  accounts,
  onContinue,
}: {
  /** Addresses belonging to the account creating this multisig (G or smart account). */
  creatorSignerAddresses: string[]
  accounts: StoredAccount[]
  onContinue: (owners: MultisigOwner[]) => void
}) {
  const [owners, setOwners] = useState<MultisigOwner[]>([])
  const [modalStep, setModalStep] = useState<AddOwnerModalStep>('none')

  const existingAddresses = useMemo(
    () => new Set(owners.map((owner) => owner.address?.trim()).filter(Boolean) as string[]),
    [owners]
  )

  const existingEmails = useMemo(
    () =>
      new Set(
        owners.map((owner) => owner.email?.trim().toLowerCase()).filter(Boolean) as string[]
      ),
    [owners]
  )

  const hasCreatorSigner = owners.some((owner) => owner.isDefault)
  const canContinue = owners.length >= 2 && hasCreatorSigner

  const removeOwner = (ownerId: string) => {
    setOwners((current) => current.filter((owner) => owner.id !== ownerId))
  }

  const closeModal = () => {
    setModalStep('none')
  }

  const handleAddOwner = (ownerName: string, method: AddOwnerMethod, detail: string) => {
    if (method === 'pasteAddress') {
      const address = detail.trim()
      if (!address || existingAddresses.has(address)) return

      const matchedAccount = findAccountByAddress(accounts, address)
      const isDefault =
        isCreatorSignerAddress(creatorSignerAddresses, address) &&
        !owners.some((owner) => owner.isDefault)

      setOwners((current) => [
        ...current,
        {
          id: matchedAccount?.id ?? `address-${Date.now()}`,
          accountId: matchedAccount?.id,
          name: ownerName,
          address,
          isDefault,
          method,
        },
      ])
    } else {
      const email = detail.trim()
      if (!email || existingEmails.has(email.toLowerCase())) return

      setOwners((current) => [
        ...current,
        {
          id: `invite-${Date.now()}`,
          name: ownerName,
          email,
          method,
        },
      ])
    }
    setModalStep('none')
  }

  return (
    <>
      <div className="flex h-full min-h-0 w-full flex-col gap-6">
        <div className="flex w-full shrink-0 flex-col items-center gap-2">
          <OnboardingSmallEmblem />
          <div className="flex w-full flex-col gap-2 text-center">
            <h1 className="text-[22px] font-medium leading-[1.32] tracking-[-0.44px] text-[#fcfcfc]">
              Add Wallet Owners
            </h1>
            <p className="text-[18px] font-normal leading-[1.36] tracking-[-0.36px] text-[#b3b3b3]">
              Add people who can approve transactions
            </p>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col justify-between">
          <div className="flex w-full flex-col gap-3">
            <button
              type="button"
              onClick={() => setModalStep('chooseMethod')}
              className="flex h-[92px] w-full items-center justify-center gap-2 rounded-[14px] border border-dashed border-[#383838] bg-[#2a2928] p-3"
            >
              <Plus className="size-6 text-[#fcfcfc]" strokeWidth={1.5} aria-hidden />
              <span className="text-base font-semibold leading-[1.31] tracking-[-0.16px] text-[#fcfcfc]">
                Add Owner
              </span>
            </button>

            <div className="flex w-full flex-col gap-3">
              {owners.map((owner) => (
                <MultisigOwnerRow
                  key={owner.id}
                  owner={owner}
                  onRemove={() => {
                    removeOwner(owner.id)
                  }}
                />
              ))}
            </div>
          </div>

          {canContinue ? (
            <OnboardingPrimaryButton onClick={() => onContinue(owners)}>Continue</OnboardingPrimaryButton>
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

      <AddOwnerFlowModals
        step={modalStep}
        onClose={closeModal}
        onSelectMethod={(method) => setModalStep(method)}
        onAddOwner={handleAddOwner}
      />
    </>
  )
}
