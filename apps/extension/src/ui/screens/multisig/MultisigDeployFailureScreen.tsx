import React from 'react'

import latchLogoUrl from 'url:../../../../assets/home/loading-logo.svg'
import failureIllustrationUrl from 'url:../../../../assets/permissions/session-failure-illustration.svg'

import { OnboardingPrimaryButton } from '../../onboarding/components/OnboardingCardButtons'

export function MultisigDeployFailureScreen({
  onTryAgain,
}: {
  onTryAgain: () => void
}) {
  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-6">
      <div className="flex w-full shrink-0 flex-col items-center">
        <img src={latchLogoUrl} alt="" className="h-5 w-10 object-contain" aria-hidden />
      </div>

      <div className="flex w-full flex-1 flex-col items-center justify-center gap-6">
        <div className="h-[262px] w-[328px]">
          <img
            src={failureIllustrationUrl}
            alt=""
            className="h-full w-full object-contain"
            aria-hidden
          />
        </div>

        <div className="flex w-full flex-col gap-2 text-center">
          <h1 className="text-[22px] font-medium leading-[1.32] tracking-[-0.44px] text-[#fcfcfc]">
            Multisig Wallet Wasn´t Created
          </h1>
          <p className="text-base font-normal leading-[1.36] tracking-[-0.32px] text-[#b3b3b3]">
            Your Multisig wallet failed to create.
          </p>
        </div>
      </div>

      <div className="mt-auto">
        <OnboardingPrimaryButton onClick={onTryAgain}>Try Again</OnboardingPrimaryButton>
      </div>
    </div>
  )
}

