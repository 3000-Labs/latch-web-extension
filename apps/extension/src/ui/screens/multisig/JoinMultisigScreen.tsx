import React from 'react'

import type { MultisigJoinPreviewResponse } from '@latch/types'

import { OnboardingPrimaryButton, OnboardingSecondaryButton } from '../../onboarding/components/OnboardingCardButtons'
import { OnboardingSmallEmblem } from '../../onboarding/components/OnboardingSmallEmblem'
import { draftMemberCount } from '../../lib/multisigMembers'

import { MultisigMembersSection } from './MultisigMembersSection'
import {
  MultisigPasskeyPicker,
  type MultisigPasskeyOption,
} from '../../multisig/MultisigPasskeyPicker'

export function JoinMultisigScreen({
  preview,
  previewLoading,
  previewError,
  joinBusy,
  joinError,
  canReusePasskey,
  passkeyOptions,
  selectedPasskeyAccountId,
  onSelectPasskeyAccountId,
  hideBack,
  onBack,
  onJoinWithExistingPasskey,
  onJoinWithNewPasskey,
  flowVariant = 'draft',
  waiting = false,
}: {
  preview: MultisigJoinPreviewResponse | null
  previewLoading: boolean
  previewError: string | null
  joinBusy: boolean
  joinError: string | null
  canReusePasskey: boolean
  passkeyOptions?: MultisigPasskeyOption[]
  selectedPasskeyAccountId?: string
  onSelectPasskeyAccountId?: (accountId: string) => void
  hideBack?: boolean
  onBack: () => void
  onJoinWithExistingPasskey: () => void
  onJoinWithNewPasskey: () => void
  /** Cosign v1 join uses relay + membership discovery after deploy. */
  flowVariant?: 'cosign' | 'draft'
  waiting?: boolean
}) {
  const members = preview?.members ?? preview?.draft?.members ?? []
  const threshold = preview?.threshold ?? preview?.draft?.threshold
  const ownerCount = draftMemberCount({
    members,
    validMemberCount: preview?.validMemberCount ?? preview?.draft?.validMemberCount,
  })

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-6">
      {!hideBack ? (
        <button type="button" onClick={onBack} className="self-start text-sm text-[#b3b3b3]">
          Back
        </button>
      ) : null}

      <div className="flex w-full shrink-0 flex-col items-center gap-2">
        <OnboardingSmallEmblem />
        <div className="flex w-full flex-col gap-2 text-center">
          <h1 className="text-[22px] font-medium leading-[1.32] tracking-[-0.44px] text-[#fcfcfc]">
            Join multisig wallet
          </h1>
          <p className="text-[18px] font-normal leading-[1.36] tracking-[-0.36px] text-[#b3b3b3]">
            {flowVariant === 'cosign'
              ? waiting
                ? 'Your device is registered. Waiting for the wallet owner to finish granting access.'
                : canReusePasskey
                  ? 'Sign in with your passkey to register this device for the shared wallet.'
                  : 'Sign in with a passkey or seed account, then register this device for the shared wallet.'
              : canReusePasskey
                ? 'Use your existing Latch passkey or create a new one for this wallet.'
                : 'Add your passkey as a co-owner before the wallet is deployed.'}
          </p>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col justify-between gap-4 overflow-y-auto">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 rounded-[14px] border border-[#383838] bg-[#2a2928] p-4">
            {previewLoading ? (
              <p className="text-sm text-[#b3b3b3]">Loading invite…</p>
            ) : previewError ? (
              <p className="text-sm text-red-400">{previewError}</p>
            ) : (
              <>
                {threshold != null ? (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-[#b3b3b3]">Approval threshold</span>
                    <span className="text-sm font-semibold text-[#fcfcfc]">
                      {threshold} approval{threshold === 1 ? '' : 's'} required
                    </span>
                  </div>
                ) : null}
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-[#b3b3b3]">Owners added</span>
                  <span className="text-sm font-semibold text-primary">{ownerCount}</span>
                </div>
              <p className="text-xs leading-[1.4] text-[#b3b3b3]">
                {flowVariant === 'cosign'
                  ? waiting
                    ? 'The wallet owner will grant access shortly. You can close this screen and check Multisig Wallets later.'
                    : 'After you continue, the wallet owner receives your device key and completes setup.'
                  : ownerCount === 0
                    ? 'You can be the first owner to join with your passkey.'
                    : `${ownerCount} owner${ownerCount === 1 ? ' has' : 's have'} already joined. Add your passkey to complete the owner set.`}
              </p>
              </>
            )}
          </div>

          {!previewLoading && !previewError ? (
            <MultisigMembersSection
              title="Current owners"
              members={members}
              emptyLabel="No owners on this invite yet."
            />
          ) : null}

          {!previewLoading && !previewError && canReusePasskey ? (
            <div className="flex flex-col gap-2">
              <MultisigPasskeyPicker
                options={passkeyOptions ?? []}
                selectedAccountId={selectedPasskeyAccountId}
                onSelect={(id) => onSelectPasskeyAccountId?.(id)}
                disabled={joinBusy}
              />
              <p className="text-xs text-[#b3b3b3]">
                Join with your selected passkey — no extra sign-in or QR code needed.
              </p>
            </div>
          ) : null}

          {joinError ? <p className="text-sm text-red-400">{joinError}</p> : null}
        </div>

        <div className="flex flex-col gap-3">
          {canReusePasskey ? (
            <>
              <OnboardingPrimaryButton
                disabled={
                  joinBusy ||
                  previewLoading ||
                  Boolean(previewError) ||
                  waiting ||
                  !selectedPasskeyAccountId
                }
                onClick={onJoinWithExistingPasskey}
              >
                {joinBusy ? 'Joining…' : waiting ? 'Waiting for owner…' : 'Join with selected passkey'}
              </OnboardingPrimaryButton>
              <OnboardingSecondaryButton
                disabled={joinBusy || previewLoading || Boolean(previewError) || waiting}
                onClick={onJoinWithNewPasskey}
              >
                Create new device passkey
              </OnboardingSecondaryButton>
            </>
          ) : (
            <>
              <OnboardingPrimaryButton
                disabled={joinBusy || previewLoading || Boolean(previewError)}
                onClick={onJoinWithNewPasskey}
              >
                {joinBusy ? 'Adding passkey…' : 'Create device passkey'}
              </OnboardingPrimaryButton>
              <p className="text-center text-xs text-[#b3b3b3]">
                Uses this computer&apos;s fingerprint, face, or PIN — not a phone QR code.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
