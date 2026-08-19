import React, { useState } from 'react'
import { Plus } from 'lucide-react'

import type { MultisigDraftMember } from '@latch/types'

import biometricsIconUrl from 'url:../../../../assets/icons/biometrics.svg'

import { OnboardingPrimaryButton } from '../../onboarding/components/OnboardingCardButtons'
import { OnboardingSmallEmblem } from '../../onboarding/components/OnboardingSmallEmblem'

import { AddOwnerFlowModals, type AddOwnerModalStep } from './AddOwnerFlowModals'
import { ConfirmRemoveOwnerModal } from './ConfirmRemoveOwnerModal'
import { MultisigInviteShareCard } from './MultisigWalletsScreen'
import { MultisigMembersSection } from './MultisigMembersSection'
import { MultisigBackHeader } from './MultisigBackHeader'
import {
  MultisigPasskeyPicker,
  type MultisigPasskeyOption,
} from '../../multisig/MultisigPasskeyPicker'

export function AddMultisigOwnersScreen({
  walletName,
  members,
  inviteUrl,
  inviteToken,
  youMemberId,
  passkeyAdding,
  passkeyError,
  passkeyOptions,
  selectedPasskeyAccountId,
  selectedPasskeyInOwners,
  onSelectPasskeyAccountId,
  canReusePasskey,
  addBusy,
  addError,
  refreshBusy,
  ownersLiveUpdating,
  onBack,
  onAddSelectedPasskeyOwner,
  onAddNewPasskeyOwner,
  onAddOwnerByAddress,
  onRemoveMember,
  onRefreshMembers,
  onContinue,
}: {
  walletName: string
  members: MultisigDraftMember[]
  inviteUrl: string
  inviteToken: string
  youMemberId?: string
  passkeyAdding?: boolean
  passkeyError?: string | null
  passkeyOptions?: MultisigPasskeyOption[]
  selectedPasskeyAccountId?: string
  selectedPasskeyInOwners?: boolean
  onSelectPasskeyAccountId?: (accountId: string) => void
  canReusePasskey?: boolean
  addBusy?: boolean
  addError?: string | null
  refreshBusy?: boolean
  ownersLiveUpdating?: boolean
  onBack: () => void
  onAddSelectedPasskeyOwner: () => void
  onAddNewPasskeyOwner: () => void
  onAddOwnerByAddress: (ownerName: string, address: string) => void
  onRemoveMember: (memberId: string) => void
  onRefreshMembers: () => void
  onContinue: () => void
}) {
  const [modalStep, setModalStep] = useState<AddOwnerModalStep>('none')
  const [pendingRemoveMemberId, setPendingRemoveMemberId] = useState<string | null>(null)
  const hasYourPasskey = Boolean(youMemberId)
  const canContinue = members.length >= 2 && !passkeyAdding && !addBusy

  const handleRequestRemoveMember = (memberId: string) => {
    setPendingRemoveMemberId(memberId)
  }

  const handleCancelRemoveMember = () => {
    setPendingRemoveMemberId(null)
  }

  const handleConfirmRemoveMember = () => {
    if (!pendingRemoveMemberId) return
    onRemoveMember(pendingRemoveMemberId)
    setPendingRemoveMemberId(null)
  }

  return (
    <>
      <div className="flex h-full min-h-0 w-full flex-col gap-6">
        <MultisigBackHeader onBack={onBack} />
        <div className="flex w-full shrink-0 flex-col items-center gap-2">
          <OnboardingSmallEmblem />
          <div className="flex w-full flex-col gap-2 text-center">
            <h1 className="text-[22px] font-medium leading-[1.32] tracking-[-0.44px] text-[#fcfcfc]">
              Add Wallet Owners
            </h1>
            <p className="text-[18px] font-normal leading-[1.36] tracking-[-0.36px] text-[#b3b3b3]">
              Add owners by passkey, address, or invite link
            </p>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col justify-between gap-4 overflow-y-auto">
          <div className="flex w-full flex-col gap-3">
            {passkeyError ? <p className="text-sm text-red-400">{passkeyError}</p> : null}
            {addError ? <p className="text-sm text-red-400">{addError}</p> : null}

            <MultisigInviteShareCard inviteUrl={inviteUrl} inviteToken={inviteToken} />

            <MultisigMembersSection
              title="Owners"
              members={members}
              youMemberId={youMemberId}
              emptyLabel="No owners added yet."
              onRemoveMember={handleRequestRemoveMember}
            />

            {ownersLiveUpdating ? (
              <p className="text-xs text-[#b3b3b3]">
                Owner list updates automatically when someone joins via your invite link.
              </p>
            ) : null}

            {!hasYourPasskey && canReusePasskey ? (
              <div className="flex flex-col gap-3">
                <MultisigPasskeyPicker
                  options={passkeyOptions ?? []}
                  selectedAccountId={selectedPasskeyAccountId}
                  onSelect={(id) => onSelectPasskeyAccountId?.(id)}
                  disabled={passkeyAdding || addBusy}
                />
                <button
                  type="button"
                  onClick={onAddSelectedPasskeyOwner}
                  disabled={passkeyAdding || addBusy || selectedPasskeyInOwners || !selectedPasskeyAccountId}
                  className="flex h-[52px] w-full items-center justify-center rounded-[14px] bg-primary text-base font-semibold text-[#121212] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {selectedPasskeyInOwners ? 'Passkey already added' : 'Add selected passkey'}
                </button>
                <button
                  type="button"
                  onClick={onAddNewPasskeyOwner}
                  disabled={passkeyAdding || addBusy}
                  className="self-start text-sm font-medium text-primary disabled:opacity-50"
                >
                  Create a new device passkey instead
                </button>
              </div>
            ) : hasYourPasskey ? (
              <p className="text-sm text-[#b3b3b3]">Your passkey is listed in Owners above.</p>
            ) : (
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={onAddNewPasskeyOwner}
                  disabled={passkeyAdding || addBusy}
                  className="flex h-[92px] w-full items-center justify-center gap-2 rounded-[14px] border border-dashed border-[#383838] bg-[#2a2928] p-3 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <img src={biometricsIconUrl} alt="" className="size-6 object-contain" aria-hidden />
                  <span className="text-base font-semibold text-[#fcfcfc]">Create device passkey</span>
                </button>
                <p className="text-xs text-[#b3b3b3]">
                  Creates a passkey on this computer — not a phone QR code.
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={() => setModalStep('pasteAddress')}
              disabled={addBusy || passkeyAdding}
              className="flex h-[92px] w-full items-center justify-center gap-2 rounded-[14px] border border-dashed border-[#383838] bg-[#2a2928] p-3 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="size-6 text-[#fcfcfc]" strokeWidth={1.5} aria-hidden />
              <span className="text-base font-semibold text-[#fcfcfc]">Add owner by address</span>
            </button>

            <button
              type="button"
              onClick={onRefreshMembers}
              disabled={refreshBusy || passkeyAdding || addBusy}
              className="self-start text-sm font-medium text-primary disabled:opacity-50"
            >
              {refreshBusy ? 'Refreshing…' : 'Refresh owner list'}
            </button>
          </div>

          {canContinue ? (
            <OnboardingPrimaryButton onClick={onContinue}>Continue</OnboardingPrimaryButton>
          ) : (
            <div className="flex flex-col gap-2">
              <button
                type="button"
                disabled
                className="relative flex h-[50px] w-full cursor-not-allowed items-center justify-center rounded-[32px] border border-[#2b2a29] bg-[#383838] text-[18px] font-semibold text-[#d7d7d7]"
              >
                Continue
              </button>
              <p className="text-center text-xs text-[#b3b3b3]">
                Add at least 2 owners to continue — by passkey, pasted address, or invite link.
              </p>
            </div>
          )}
        </div>
      </div>

      <AddOwnerFlowModals
        step={modalStep}
        onClose={() => setModalStep('none')}
        onAddOwner={(ownerName, address) => {
          onAddOwnerByAddress(ownerName, address)
          setModalStep('none')
        }}
      />

      <ConfirmRemoveOwnerModal
        isOpen={pendingRemoveMemberId != null}
        walletName={walletName}
        onCancel={handleCancelRemoveMember}
        onConfirm={handleConfirmRemoveMember}
      />
    </>
  )
}
