import emblemUrl from 'url:../../../assets/onboarding/web/latch-logo-emblem.svg'
import importSuccessUrl from 'url:../../../assets/onboarding/web/import-success.svg'

import { OnboardingPrimaryButton } from './components/OnboardingCardButtons'

export function OnboardingImportSuccessCard({
  onGoToDashboard,
}: {
  onGoToDashboard: () => void
}) {
  return (
    <div className="flex h-[600px] w-[420px] flex-col gap-2 rounded-[24px] bg-[#1c1c1c] p-6 shadow-[-5px_6px_7.7px_rgba(9,9,9,0.3)]">
      <div className="flex min-h-0 flex-1 flex-col items-center justify-between">
        <img
          src={emblemUrl}
          alt=""
          className="h-6 w-[45px] shrink-0"
          width={45}
          height={24}
          draggable={false}
        />

        <div className="flex w-full flex-col items-center gap-2">
          <img
            src={importSuccessUrl}
            alt=""
            className="h-[214.912px] w-[247.452px] shrink-0 animate-pop"
            width={248}
            height={215}
            draggable={false}
          />
          <div className="flex w-full flex-col items-center gap-[14px] text-center">
            <h1 className="w-full text-[22px] font-medium leading-[1.32] tracking-[-0.44px] text-[#fcfcfc]">
              Account Created
            </h1>
            <p className="w-full text-[16px] font-normal leading-[1.36] tracking-[-0.32px] text-[#b3b3b3]">
              You can access your account now.
            </p>
          </div>
        </div>

        <OnboardingPrimaryButton onClick={onGoToDashboard}>Go to Dashboard</OnboardingPrimaryButton>
      </div>
    </div>
  )
}
