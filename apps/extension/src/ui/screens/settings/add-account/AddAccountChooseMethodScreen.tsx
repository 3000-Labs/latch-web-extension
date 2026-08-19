import {
  OnboardingPrimaryButton,
  OnboardingSecondaryButton,
} from '../../../onboarding/components/OnboardingCardButtons'
import { OnboardingSmallEmblem } from '../../../onboarding/components/OnboardingSmallEmblem'
import { AddAccountBackHeader } from './AddAccountBackHeader'

export type AddAccountMethod = 'passkey' | 'createPasskey' | 'recoveryPhrase'

function MethodOptionCard({
  title,
  description,
  selected,
  onClick,
}: {
  title: string
  description: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'w-full rounded-[14px] bg-[#2a2928] p-3 text-left',
        selected ? 'border border-[#f0a300]' : 'border border-transparent',
      ].join(' ')}
    >
      <p className="text-[16px] font-semibold leading-[1.31] tracking-[-0.16px] text-[#fcfcfc]">
        {title}
      </p>
      <p className="mt-1.5 text-[14px] font-normal leading-[1.34] tracking-[-0.28px] text-[#b3b3b3]">
        {description}
      </p>
    </button>
  )
}

export function AddAccountChooseMethodScreen({
  selected,
  onSelect,
  onContinue,
  onBack,
}: {
  selected: AddAccountMethod | null
  onSelect: (method: AddAccountMethod) => void
  onContinue: () => void
  onBack: () => void
}) {
  const canContinue = selected !== null

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <AddAccountBackHeader onBack={onBack} />

      <div className="flex w-full shrink-0 flex-col items-center gap-2">
        <OnboardingSmallEmblem />
        <div className="flex w-full flex-col gap-2 text-center">
          <h1 className="text-[22px] font-medium leading-[1.32] tracking-[-0.44px] text-[#fcfcfc]">
            Add Account
          </h1>
          <p className="text-[18px] font-normal leading-[1.36] tracking-[-0.36px] text-[#b3b3b3]">
            Choose how you want to add another signer
          </p>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col justify-between">
        <div className="flex w-full flex-col gap-3">
          <MethodOptionCard
            title="Existing passkey"
            description="Log in with a passkey you already use"
            selected={selected === 'passkey'}
            onClick={() => onSelect('passkey')}
          />
          <MethodOptionCard
            title="Create passkey"
            description="Register a new passkey account"
            selected={selected === 'createPasskey'}
            onClick={() => onSelect('createPasskey')}
          />
          <MethodOptionCard
            title="Recovery phrase"
            description="Add a seed based account"
            selected={selected === 'recoveryPhrase'}
            onClick={() => onSelect('recoveryPhrase')}
          />
        </div>

        {canContinue ? (
          <OnboardingPrimaryButton onClick={onContinue}>Continue</OnboardingPrimaryButton>
        ) : (
          <OnboardingSecondaryButton disabled>Continue</OnboardingSecondaryButton>
        )}
      </div>
    </div>
  )
}
