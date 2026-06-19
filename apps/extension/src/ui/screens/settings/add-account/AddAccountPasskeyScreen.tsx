import biometricFingerprintUrl from 'url:../../../../../assets/onboarding/web/biometric-fingerprint.svg'

import { OnboardingPrimaryButton } from '../../../onboarding/components/OnboardingCardButtons'
import { OnboardingSmallEmblem } from '../../../onboarding/components/OnboardingSmallEmblem'
import { AddAccountBackHeader } from './AddAccountBackHeader'

export function AddAccountPasskeyScreen({
  prefetchReady,
  prefetchError,
  actionError,
  busy,
  onAuthenticate,
  onBack,
}: {
  prefetchReady: boolean
  prefetchError: string | null
  actionError: string | null
  busy: boolean
  onAuthenticate: () => void
  onBack: () => void
}) {
  const errorMessage = actionError ?? prefetchError
  const canAuthenticate = prefetchReady && !busy
  const primaryLabel = !prefetchReady ? 'Preparing…' : busy ? 'Authenticating…' : 'Authenticate'

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <AddAccountBackHeader onBack={onBack} />

      <div className="flex w-full shrink-0 flex-col items-center gap-2">
        <OnboardingSmallEmblem />
        <div className="flex w-full flex-col gap-2 text-center">
          <h1 className="text-[22px] font-medium leading-[1.32] tracking-[-0.44px] text-[#fcfcfc]">
            Use Existing Passkey
          </h1>
          <p className="text-[18px] font-normal leading-[1.36] tracking-[-0.36px] text-[#b3b3b3]">
            Add a signer using an existing passkey
          </p>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col justify-between">
        <div className="flex flex-col items-center gap-3">
          <div className="relative flex size-[115px] shrink-0 items-center justify-center rounded-2xl bg-[#2a2928] shadow-[0px_0px_0px_0px_#262626,0px_20px_50px_0px_rgba(0,0,0,0.3)]">
            <img
              src={biometricFingerprintUrl}
              alt=""
              className="size-[76px]"
              width={76}
              height={76}
              draggable={false}
            />
          </div>

          {prefetchReady ? (
            <div className="w-full rounded-[14px] bg-[#2a2928] p-3">
              <p className="text-[16px] font-semibold leading-[1.31] tracking-[-0.16px] text-[#fcfcfc]">
                Passkey Found
              </p>
              <p className="mt-1.5 text-[14px] font-normal leading-[1.34] tracking-[-0.28px] text-[#b3b3b3]">
                Use your device&apos;s fingerprint or face recognition
              </p>
            </div>
          ) : null}

          {errorMessage ? (
            <p className="text-center text-[14px] leading-[1.34] tracking-[-0.28px] text-[#b3b3b3]">
              {errorMessage}
            </p>
          ) : null}
        </div>

        <OnboardingPrimaryButton disabled={!canAuthenticate} onClick={onAuthenticate}>
          {primaryLabel}
        </OnboardingPrimaryButton>
      </div>
    </div>
  )
}
