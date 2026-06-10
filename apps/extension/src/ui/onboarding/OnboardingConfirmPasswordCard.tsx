import { OnboardingPrimaryButton } from './components/OnboardingCardButtons'
import { OnboardingCardHeader } from './components/OnboardingCardHeader'
import { OnboardingPasswordDisclaimer } from './components/OnboardingPasswordDisclaimer'
import { OnboardingPasswordField } from './components/OnboardingPasswordField'
import { OnboardingSmallEmblem } from './components/OnboardingSmallEmblem'

export function OnboardingConfirmPasswordCard({
  password,
  onPasswordChange,
  onBack,
  onClose,
  onContinue,
  busy,
}: {
  password: string
  onPasswordChange: (value: string) => void
  onBack: () => void
  onClose: () => void
  onContinue: () => void
  busy?: boolean
}) {
  const canContinue = password.length >= 8 && !busy

  return (
    <div className="flex h-[600px] w-[420px] flex-col gap-2 rounded-[24px] bg-[#1c1c1c] p-6 shadow-[-5px_6px_7.7px_rgba(9,9,9,0.3)]">
      <OnboardingCardHeader onBack={onBack} onClose={onClose} />

      <div className="flex min-h-0 flex-1 flex-col gap-6">
        <div className="flex min-h-0 flex-1 flex-col gap-6">
          <div className="flex w-full shrink-0 flex-col items-center gap-2">
            <OnboardingSmallEmblem />
            <div className="flex w-full flex-col gap-2 text-center">
              <h1 className="text-[22px] font-medium leading-[1.32] tracking-[-0.44px] text-[#fcfcfc]">
                Confirm Your Password
              </h1>
              <OnboardingPasswordDisclaimer />
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col justify-between">
            <OnboardingPasswordField value={password} onChange={onPasswordChange} autoFocus />
            <OnboardingPrimaryButton onClick={onContinue} disabled={!canContinue}>
              Continue
            </OnboardingPrimaryButton>
          </div>
        </div>
      </div>
    </div>
  )
}
