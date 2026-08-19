import React, { useState } from 'react'

import { OnboardingPrimaryButton } from '../../onboarding/components/OnboardingCardButtons'
import { OnboardingSmallEmblem } from '../../onboarding/components/OnboardingSmallEmblem'

export function MultisigSuccessScreen({
  walletName,
  smartAccountAddress,
  threshold,
  memberCount,
  inviteUrl,
  inviteToken,
  onGoHome,
}: {
  walletName: string
  smartAccountAddress: string
  threshold: number
  memberCount: number
  inviteUrl?: string
  inviteToken?: string
  onGoHome: () => void
}) {
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-6">
      <div className="flex w-full shrink-0 flex-col items-center gap-2">
        <OnboardingSmallEmblem />
        <div className="flex w-full flex-col gap-2 text-center">
          <h1 className="text-[22px] font-medium leading-[1.32] tracking-[-0.44px] text-[#fcfcfc]">
            Multisig wallet ready
          </h1>
          <p className="text-[18px] font-normal leading-[1.36] tracking-[-0.36px] text-[#b3b3b3]">
            {walletName} · {threshold} of {memberCount}
          </p>
        </div>
      </div>

      <div className="rounded-[14px] border border-[#383838] bg-[#2a2928] p-4">
        <p className="text-sm text-[#b3b3b3]">Smart account</p>
        <p className="mt-1 break-all font-mono text-sm text-[#fcfcfc]">{smartAccountAddress}</p>
      </div>

      {inviteUrl ? (
        <div className="rounded-[14px] border border-dashed border-[#383838] bg-[#2a2928] p-4">
          <p className="text-sm font-semibold text-[#fcfcfc]">Invite co-owners</p>
          <p className="mt-1 text-sm text-[#b3b3b3]">
            Share the invite link or code so other owners can register their device and receive
            wallet access.
          </p>
          <div className="mt-3 flex flex-col gap-2">
            <button
              type="button"
              className="text-sm font-medium text-primary"
              onClick={() => {
                void navigator.clipboard.writeText(inviteUrl).then(() => {
                  setCopiedLink(true)
                  setCopiedCode(false)
                })
              }}
            >
              {copiedLink ? 'Copied invite link' : 'Copy invite link'}
            </button>
            {inviteToken ? (
              <button
                type="button"
                className="text-sm font-medium text-primary"
                onClick={() => {
                  void navigator.clipboard.writeText(inviteToken).then(() => {
                    setCopiedCode(true)
                    setCopiedLink(false)
                  })
                }}
              >
                {copiedCode ? 'Copied invite code' : 'Copy invite code'}
              </button>
            ) : null}
          </div>
          {inviteToken ? (
            <p className="mt-3 break-all font-mono text-xs text-[#b3b3b3]">{inviteToken}</p>
          ) : null}
        </div>
      ) : null}

      <div className="mt-auto">
        <OnboardingPrimaryButton onClick={onGoHome}>Go to wallet</OnboardingPrimaryButton>
      </div>
    </div>
  )
}
